import { db } from "@workspace/db";
import { assignments, assignmentSchedules } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";
export type ScheduleStatus = "active" | "paused" | "ended";

export interface ScheduleInput {
  frequency: Frequency;
  daysOfWeek?: number[] | null;
  dayOfMonth?: number | null;
  intervalDays?: number | null;
  dueTimeOfDay?: string | null;
  startDate: string;
  endDate?: string | null;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateSchedule(s: ScheduleInput): { ok: true } | { ok: false; error: string } {
  if (!["daily", "weekly", "biweekly", "monthly", "custom"].includes(s.frequency)) {
    return { ok: false, error: "Invalid frequency" };
  }
  if (s.dueTimeOfDay && !HHMM.test(s.dueTimeOfDay)) {
    return { ok: false, error: "dueTimeOfDay must be HH:MM (24h)" };
  }
  if (!s.startDate || isNaN(Date.parse(s.startDate))) {
    return { ok: false, error: "startDate required" };
  }
  if (s.endDate && isNaN(Date.parse(s.endDate))) {
    return { ok: false, error: "endDate invalid" };
  }
  if (s.endDate && new Date(s.endDate) < new Date(s.startDate)) {
    return { ok: false, error: "endDate must be on or after startDate" };
  }
  if ((s.frequency === "weekly" || s.frequency === "biweekly")) {
    if (!Array.isArray(s.daysOfWeek) || s.daysOfWeek.length === 0) {
      return { ok: false, error: "daysOfWeek required for weekly/biweekly" };
    }
    if (s.daysOfWeek.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return { ok: false, error: "daysOfWeek values must be integers 0-6" };
    }
  }
  if (s.frequency === "monthly") {
    if (!Number.isInteger(s.dayOfMonth) || (s.dayOfMonth as number) < 1 || (s.dayOfMonth as number) > 31) {
      return { ok: false, error: "dayOfMonth (1-31) required for monthly" };
    }
  }
  if (s.frequency === "custom") {
    if (!Number.isInteger(s.intervalDays) || (s.intervalDays as number) < 1) {
      return { ok: false, error: "intervalDays (>=1) required for custom" };
    }
  }
  return { ok: true };
}

/** Day key in UTC: YYYY-MM-DD. */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function parseDayKey(k: string): Date {
  return new Date(`${k}T00:00:00.000Z`);
}
function addDaysUTC(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
function lastDayOfMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}
function daysBetweenUTC(a: Date, b: Date): number {
  const ms = parseDayKey(dayKey(b)).getTime() - parseDayKey(dayKey(a)).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

interface ScheduleRow {
  id: string;
  frequency: Frequency;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  intervalDays: number | null;
  startDate: Date;
  endDate: Date | null;
  status: ScheduleStatus;
}

export function isOccurrenceDay(s: ScheduleRow, dateUTC: Date): boolean {
  const dayKeyD = dayKey(dateUTC);
  const startKey = dayKey(s.startDate);
  if (dayKeyD < startKey) return false;
  if (s.endDate && dayKeyD > dayKey(s.endDate)) return false;

  const dow = dateUTC.getUTCDay();
  switch (s.frequency) {
    case "daily":
      return true;
    case "weekly":
      return Array.isArray(s.daysOfWeek) && s.daysOfWeek.includes(dow);
    case "biweekly": {
      if (!Array.isArray(s.daysOfWeek) || !s.daysOfWeek.includes(dow)) return false;
      // even-numbered week from startDate
      const days = daysBetweenUTC(s.startDate, dateUTC);
      const weekIndex = Math.floor(days / 7);
      return weekIndex % 2 === 0;
    }
    case "monthly": {
      if (s.dayOfMonth == null) return false;
      const dom = dateUTC.getUTCDate();
      const lastDom = lastDayOfMonth(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth());
      const target = Math.min(s.dayOfMonth, lastDom); // clamp to month length
      return dom === target;
    }
    case "custom": {
      if (!s.intervalDays || s.intervalDays < 1) return false;
      const days = daysBetweenUTC(s.startDate, dateUTC);
      return days >= 0 && days % s.intervalDays === 0;
    }
  }
}

/** Combine a UTC day with HH:MM time-of-day → a single UTC Date for dueDate. */
function combineDayAndTime(dayUTC: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const r = new Date(dayUTC);
  r.setUTCHours(h, m, 0, 0);
  return r;
}

export interface MaterialiseResult {
  scheduleId: string;
  created: number;
  skipped: number;
  newWatermark: string | null;
}

/**
 * Materialise pending occurrences for a single schedule.
 * Idempotent: re-running on the same day is a no-op.
 * Walks forward from max(lastMaterialisedDate+1d, startDate) up to today+horizonDays.
 */
export async function materialiseSchedule(
  scheduleId: string,
  opts: { horizonDays?: number; today?: Date } = {},
): Promise<MaterialiseResult> {
  const horizon = opts.horizonDays ?? 7;
  const today = opts.today ?? new Date();

  const [s] = await db
    .select()
    .from(assignmentSchedules)
    .where(eq(assignmentSchedules.id, scheduleId))
    .limit(1);

  if (!s) return { scheduleId, created: 0, skipped: 0, newWatermark: null };
  if (s.status !== "active") {
    return { scheduleId, created: 0, skipped: 0, newWatermark: s.lastMaterialisedDate ? dayKey(s.lastMaterialisedDate) : null };
  }

  const startKey = dayKey(s.startDate);
  const watermarkKey = s.lastMaterialisedDate ? dayKey(s.lastMaterialisedDate) : null;
  const fromKey = watermarkKey
    ? dayKey(addDaysUTC(parseDayKey(watermarkKey), 1))
    : startKey;

  const horizonKey = dayKey(addDaysUTC(today, horizon));
  const endKey = s.endDate ? dayKey(s.endDate) : horizonKey;
  const toKey = horizonKey < endKey ? horizonKey : endKey;

  if (fromKey > toKey) {
    return { scheduleId, created: 0, skipped: 0, newWatermark: watermarkKey };
  }

  const sRow: ScheduleRow = {
    id: s.id,
    frequency: s.frequency as Frequency,
    daysOfWeek: s.daysOfWeek,
    dayOfMonth: s.dayOfMonth,
    intervalDays: s.intervalDays,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status as ScheduleStatus,
  };

  let created = 0;
  let skipped = 0;
  const dueTime = s.dueTimeOfDay || "23:59";

  let cursor = parseDayKey(fromKey);
  const stop = parseDayKey(toKey);

  while (cursor <= stop) {
    if (isOccurrenceDay(sRow, cursor)) {
      const dueDate = combineDayAndTime(cursor, dueTime);

      // Race-safe insert: relies on partial unique index
      // (schedule_id, due_date) where schedule_id IS NOT NULL. ON CONFLICT
      // makes concurrent runs (cron + inline call after schedule create) safe.
      const inserted = await db
        .insert(assignments)
        .values({
          batchId: s.batchId,
          postedBy: s.postedBy,
          title: s.title,
          subject: s.subject,
          description: s.description,
          fileUrl: s.fileUrl,
          maxMarks: s.maxMarks,
          dueDate,
          isVisible: true,
          scheduleId: s.id,
        })
        .onConflictDoNothing({ target: [assignments.scheduleId, assignments.dueDate] })
        .returning({ id: assignments.id });

      if (inserted.length) created++;
      else skipped++;
    }
    cursor = addDaysUTC(cursor, 1);
  }

  await db
    .update(assignmentSchedules)
    .set({ lastMaterialisedDate: stop, updatedAt: new Date() })
    .where(eq(assignmentSchedules.id, s.id));

  return { scheduleId: s.id, created, skipped, newWatermark: dayKey(stop) };
}

export async function materialiseAllActive(opts: { horizonDays?: number; today?: Date } = {}) {
  const rows = await db
    .select({ id: assignmentSchedules.id })
    .from(assignmentSchedules)
    .where(eq(assignmentSchedules.status, "active"));

  const results: MaterialiseResult[] = [];
  for (const r of rows) {
    try {
      results.push(await materialiseSchedule(r.id, opts));
    } catch (err) {
      console.error(`[materialise-assignments] schedule ${r.id} failed:`, err);
      results.push({ scheduleId: r.id, created: 0, skipped: 0, newWatermark: null });
    }
  }
  return results;
}
