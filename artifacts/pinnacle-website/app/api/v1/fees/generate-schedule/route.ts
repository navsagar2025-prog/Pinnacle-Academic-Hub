import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { students, batches, courses, feeRecords } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: NextRequest) {
  try {
    await requirePortalRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const studentId = body?.studentId as string | undefined;
  const plan = body?.plan as "annual" | "monthly" | undefined;
  const startMonth = typeof body?.startMonth === "number" ? body.startMonth : new Date().getMonth();
  const startYear = typeof body?.startYear === "number" ? body.startYear : new Date().getFullYear();

  if (!studentId || (plan !== "annual" && plan !== "monthly")) {
    return NextResponse.json({ error: "studentId and plan ('annual' | 'monthly') are required" }, { status: 400 });
  }

  const [student] = await db
    .select({
      id: students.id,
      batchId: students.batchId,
      annualFee: courses.annualFee,
      admissionFee: courses.admissionFee,
      courseTitle: courses.title,
    })
    .from(students)
    .leftJoin(batches, eq(students.batchId, batches.id))
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (!student.batchId || !student.annualFee) {
    return NextResponse.json({ error: "Student is not enrolled in a batch with a fee" }, { status: 400 });
  }

  const existing = await db
    .select({ id: feeRecords.id })
    .from(feeRecords)
    .where(eq(feeRecords.studentId, studentId))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Fee schedule already exists for this student" }, { status: 409 });
  }

  await db.update(students).set({ feePlan: plan, updatedAt: new Date() }).where(eq(students.id, studentId));

  const annualFee = student.annualFee;
  const admissionFee = student.admissionFee ?? 0;

  const records: Array<{
    studentId: string;
    period: string;
    amount: number;
    dueDate: Date;
    status: "due";
    notes: string;
  }> = [];

  if (plan === "annual") {
    const dueDate = new Date(startYear, startMonth, 30);
    records.push({
      studentId,
      period: `Annual Fee ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
      amount: annualFee + admissionFee,
      dueDate,
      status: "due",
      notes: admissionFee > 0
        ? `Includes admission fee of ₹${admissionFee.toLocaleString("en-IN")}`
        : "Annual lump-sum payment",
    });
  } else {
    const monthlyAmount = Math.ceil(annualFee / 12);
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonth + i) % 12;
      const yearOffset = Math.floor((startMonth + i) / 12);
      const dueDate = new Date(startYear + yearOffset, monthIdx, 5);
      const isFirst = i === 0;
      records.push({
        studentId,
        period: `${MONTH_NAMES[monthIdx]} ${startYear + yearOffset}`,
        amount: isFirst ? monthlyAmount + admissionFee : monthlyAmount,
        dueDate,
        status: "due",
        notes: isFirst && admissionFee > 0
          ? `Monthly EMI ${i + 1}/12 + admission fee of ₹${admissionFee.toLocaleString("en-IN")}`
          : `Monthly EMI ${i + 1}/12`,
      });
    }
  }

  await db.insert(feeRecords).values(records);

  return NextResponse.json({
    success: true,
    plan,
    recordsCreated: records.length,
    totalAmount: records.reduce((s, r) => s + r.amount, 0),
  });
}
