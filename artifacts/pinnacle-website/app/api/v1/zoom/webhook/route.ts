import { db } from "@workspace/db";
import { liveClasses, classRecordings, batches } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import crypto from "crypto";

function verifyZoomWebhook(payload: string, signature: string, timestamp: string, secret: string): boolean {
  const message = `v0:${timestamp}:${payload}`;
  const expected = "v0=" + crypto.createHmac("sha256", secret).update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-zm-signature") ?? "";
  const timestamp = request.headers.get("x-zm-request-timestamp") ?? "";
  const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN ?? "";

  if (webhookSecret && signature && timestamp) {
    if (!verifyZoomWebhook(body, signature, timestamp, webhookSecret)) {
      return err("Invalid webhook signature", 401);
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return err("Invalid JSON body", 400);
  }

  const eventType = event.event as string;

  if (eventType === "endpoint.url_validation") {
    const payload = event.payload as Record<string, string>;
    const hashForValidate = crypto
      .createHmac("sha256", webhookSecret || "placeholder")
      .update(payload.plainToken)
      .digest("hex");
    return ok({ plainToken: payload.plainToken, encryptedToken: hashForValidate });
  }

  if (eventType === "recording.completed") {
    const payload = event.payload as Record<string, unknown>;
    const obj = payload.object as Record<string, unknown>;
    const meetingId = String(obj.id ?? "");
    const recordingFiles = (obj.recording_files ?? []) as Array<Record<string, unknown>>;

    const videoFile = recordingFiles.find(
      (f) => f.file_type === "MP4" && f.recording_type === "shared_screen_with_speaker_view"
    ) ?? recordingFiles.find((f) => f.file_type === "MP4");

    if (!videoFile || !meetingId) {
      return ok({ skipped: true, reason: "No MP4 recording file found" });
    }

    const recordingUrl = videoFile.play_url as string ?? videoFile.download_url as string;
    const startTime = videoFile.recording_start as string;
    const endTime = videoFile.recording_end as string;

    const [liveClass] = await db
      .select({ id: liveClasses.id, topic: liveClasses.topic, batchId: liveClasses.batchId })
      .from(liveClasses)
      .where(eq(liveClasses.zoomMeetingId, meetingId))
      .limit(1);

    if (liveClass) {
      await db
        .update(liveClasses)
        .set({ recordingUrl, status: "completed" })
        .where(eq(liveClasses.id, liveClass.id));

      const [batch] = liveClass.batchId
        ? await db.select({ id: batches.id }).from(batches).where(eq(batches.id, liveClass.batchId)).limit(1)
        : [null];

      if (batch) {
        await db.insert(classRecordings).values({
          liveClassId: liveClass.id,
          batchId: liveClass.batchId,
          title: liveClass.topic,
          subject: "Recorded Class",
          recordingUrl,
          durationMinutes: startTime && endTime
            ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
            : null,
          isVisible: true,
        });
      }
    }

    console.log(`[Zoom webhook] recording.completed for meetingId=${meetingId}, liveClassId=${liveClass?.id ?? "not found"}`);
    return ok({ received: true, meetingId, recordingUrl });
  }

  return ok({ received: true, eventType });
}
