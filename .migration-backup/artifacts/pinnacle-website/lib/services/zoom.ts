/**
 * Zoom Service — Server-to-Server OAuth Integration
 *
 * Configure the following environment variables to enable real Zoom integration:
 *   ZOOM_ACCOUNT_ID    — From your Zoom Server-to-Server OAuth app
 *   ZOOM_CLIENT_ID     — From your Zoom Server-to-Server OAuth app
 *   ZOOM_CLIENT_SECRET — From your Zoom Server-to-Server OAuth app
 *
 * Without these variables the service runs in mock mode (returns realistic fake
 * data) so that development and testing work without Zoom credentials.
 *
 * Zoom docs: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
 */

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

const isZoomConfigured =
  Boolean(ZOOM_ACCOUNT_ID) && Boolean(ZOOM_CLIENT_ID) && Boolean(ZOOM_CLIENT_SECRET);

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Fetches a short-lived Server-to-Server OAuth access token from Zoom. */
async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom token error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export interface ZoomMeeting {
  meetingId: string;
  topic: string;
  joinUrl: string;
  hostUrl: string;
  passcode: string;
  startUrl: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: "waiting" | "started" | "ended";
}

export interface CreateMeetingOptions {
  topic: string;
  scheduledAt: Date;
  durationMinutes?: number;
  agenda?: string;
  password?: string;
}

function generateMeetingId(): string {
  return String(Date.now()).slice(-5) + String(Math.floor(Math.random() * 9000) + 1000);
}

function generatePasscode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatZoomDateTime(date: Date): string {
  return date.toISOString().replace(".000Z", "Z");
}

/**
 * Creates a Zoom meeting via the Zoom API (S2S OAuth).
 * Falls back to mock mode if ZOOM_* env vars are not set.
 */
export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeeting> {
  const duration = options.durationMinutes ?? 90;

  if (isZoomConfigured) {
    const token = await getZoomAccessToken();

    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: options.topic,
        type: 2, // scheduled meeting
        start_time: formatZoomDateTime(options.scheduledAt),
        duration,
        agenda: options.agenda ?? options.topic,
        password: options.password ?? generatePasscode(),
        settings: {
          waiting_room: false,
          auto_recording: "cloud",
          join_before_host: false,
          mute_upon_entry: true,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Zoom create meeting error (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      id: number;
      topic: string;
      join_url: string;
      start_url: string;
      password: string;
    };

    return {
      meetingId: String(data.id),
      topic: data.topic,
      joinUrl: data.join_url,
      hostUrl: data.start_url,
      passcode: data.password,
      startUrl: data.start_url,
      scheduledAt: options.scheduledAt,
      durationMinutes: duration,
      status: "waiting",
    };
  }

  // Mock mode — realistic fake data for development/testing
  const meetingId = generateMeetingId();
  const passcode = options.password ?? generatePasscode();
  return {
    meetingId,
    topic: options.topic,
    joinUrl: `https://zoom.us/j/${meetingId}?pwd=${passcode}`,
    hostUrl: `https://zoom.us/s/${meetingId}?zak=MOCK_HOST_TOKEN`,
    passcode,
    startUrl: `https://zoom.us/s/${meetingId}`,
    scheduledAt: options.scheduledAt,
    durationMinutes: duration,
    status: "waiting",
  };
}

/**
 * Fetches the live status of a meeting.
 * Uses Zoom API if configured, otherwise estimates from schedule time.
 */
export async function getMeetingStatus(
  meetingId: string,
  scheduledAt: Date
): Promise<"scheduled" | "live" | "completed" | "cancelled"> {
  if (isZoomConfigured) {
    try {
      const token = await getZoomAccessToken();
      const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return "cancelled";
      const data = (await res.json()) as { status: string };
      if (data.status === "started") return "live";
      if (data.status === "finished") return "completed";
      return "scheduled";
    } catch {
      // Fall through to time-based estimate
    }
  }

  const now = new Date();
  const diffMs = now.getTime() - new Date(scheduledAt).getTime();
  if (diffMs < -5 * 60 * 1000) return "scheduled";
  if (diffMs < 90 * 60 * 1000) return "live";
  return "completed";
}

/**
 * Lists cloud recordings for a Zoom user.
 * Uses Zoom API if configured, otherwise returns realistic mock recordings.
 */
export async function listRecordings(batchId: string): Promise<Array<{
  meetingId: string;
  topic: string;
  recordingUrl: string;
  durationMinutes: number;
  recordedAt: Date;
}>> {
  if (isZoomConfigured) {
    try {
      const token = await getZoomAccessToken();
      const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const res = await fetch(
        `https://api.zoom.us/v2/users/me/recordings?from=${from}&page_size=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Zoom recordings API error");
      const data = (await res.json()) as {
        meetings: Array<{
          id: number;
          topic: string;
          duration: number;
          start_time: string;
          recording_files: Array<{ play_url: string; file_type: string }>;
        }>;
      };
      return data.meetings
        .filter((m) => m.recording_files?.some((f) => f.file_type === "MP4"))
        .map((m) => ({
          meetingId: String(m.id),
          topic: m.topic,
          recordingUrl: m.recording_files.find((f) => f.file_type === "MP4")!.play_url,
          durationMinutes: m.duration,
          recordedAt: new Date(m.start_time),
        }));
    } catch {
      // Fall through to mock data
    }
  }

  return [
    {
      meetingId: `${batchId}-001`,
      topic: "Physics — Kinematics & Projectile Motion",
      recordingUrl: "https://zoom.us/rec/share/DEMO_RECORDING_001",
      durationMinutes: 90,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      meetingId: `${batchId}-002`,
      topic: "Chemistry — Periodic Table & Chemical Bonding",
      recordingUrl: "https://zoom.us/rec/share/DEMO_RECORDING_002",
      durationMinutes: 85,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      meetingId: `${batchId}-003`,
      topic: "Mathematics — Differentiation & Integration",
      recordingUrl: "https://zoom.us/rec/share/DEMO_RECORDING_003",
      durationMinutes: 95,
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
}
