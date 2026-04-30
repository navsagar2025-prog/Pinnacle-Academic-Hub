/**
 * Zoom Service — Mocked Integration Layer
 *
 * In production this would use the Zoom Server-to-Server OAuth app:
 *   - ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET env vars
 *   - Token endpoint: https://zoom.us/oauth/token?grant_type=account_credentials
 *   - Meetings API:   https://api.zoom.us/v2/users/me/meetings
 *
 * The mock generates realistic meeting IDs and URLs so the rest of the
 * application can be built against the real interface.
 */

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

/** Deterministically generates a mock Zoom meeting ID (9–11 digits) */
function generateMeetingId(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return String(now).slice(-5) + String(rand);
}

function generatePasscode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Creates a Zoom meeting (mocked).
 * Replace the body with a real Zoom API call when credentials are available.
 */
export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeeting> {
  const meetingId = generateMeetingId();
  const passcode = options.password ?? generatePasscode();
  const duration = options.durationMinutes ?? 90;

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
 * Fetches the live status of a meeting by ID (mocked).
 * A real implementation would call GET /v2/meetings/{meetingId} or use webhooks.
 */
export async function getMeetingStatus(
  meetingId: string,
  scheduledAt: Date
): Promise<"scheduled" | "live" | "completed" | "cancelled"> {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diffMs = now.getTime() - scheduled.getTime();

  if (diffMs < -5 * 60 * 1000) return "scheduled"; // >5 min before start
  if (diffMs >= -5 * 60 * 1000 && diffMs < 90 * 60 * 1000) return "live"; // within window
  return "completed";
}

/**
 * Lists recordings for a batch/user (mocked).
 * Real API: GET /v2/users/me/recordings?from=YYYY-MM-DD
 */
export async function listRecordings(batchId: string): Promise<Array<{
  meetingId: string;
  topic: string;
  recordingUrl: string;
  durationMinutes: number;
  recordedAt: Date;
}>> {
  return [
    {
      meetingId: `${batchId}-001`,
      topic: "Physics — Kinematics & Projectile Motion",
      recordingUrl: "https://zoom.us/rec/share/MOCK001",
      durationMinutes: 90,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      meetingId: `${batchId}-002`,
      topic: "Chemistry — Periodic Table & Chemical Bonding",
      recordingUrl: "https://zoom.us/rec/share/MOCK002",
      durationMinutes: 85,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      meetingId: `${batchId}-003`,
      topic: "Mathematics — Differentiation & Integration",
      recordingUrl: "https://zoom.us/rec/share/MOCK003",
      durationMinutes: 95,
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
}
