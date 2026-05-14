import AsyncStorage from "@react-native-async-storage/async-storage";

// Resolve the Pinnacle website API base URL.
// Priority: EXPO_PUBLIC_WEBSITE_URL > derived from EXPO_PUBLIC_DOMAIN > null.
// React Native fetch requires absolute URLs, so we return null (and skip fetches)
// when no absolute URL can be constructed.
function resolveWebsiteBase(): string | null {
  const explicit = process.env.EXPO_PUBLIC_WEBSITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;
  // In Replit dev, the pinnacle-website is mounted under /pinnacle-website.
  // In production with a custom domain, set EXPO_PUBLIC_WEBSITE_URL explicitly.
  return `https://${domain}/pinnacle-website`;
}

const WEBSITE_BASE = resolveWebsiteBase();
const TOKEN_KEY = "pinnacle_portal_token";

export function hasWebsiteBase(): boolean {
  return WEBSITE_BASE !== null;
}

// In-memory cache so we don't await AsyncStorage on every request.
let cachedAuthToken: string | null = null;
let tokenLoaded = false;

async function loadToken(): Promise<string | null> {
  if (tokenLoaded) return cachedAuthToken;
  try {
    cachedAuthToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    cachedAuthToken = null;
  }
  tokenLoaded = true;
  return cachedAuthToken;
}

/**
 * Set the bearer token used for authenticated requests to the Pinnacle web API.
 * Call this from the mobile auth flow once a session token is obtained.
 * Pass null to clear the token (e.g., on sign-out).
 */
export async function setAuthToken(token: string | null): Promise<void> {
  cachedAuthToken = token;
  tokenLoaded = true;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* best-effort */
  }
}

async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!WEBSITE_BASE) return null;
  try {
    const res = await fetch(`${WEBSITE_BASE}${path}`, {
      headers: await buildHeaders(),
      credentials: "include",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function sendJson<T>(
  path: string,
  method: "POST" | "DELETE" | "PUT" | "PATCH",
  body?: unknown,
): Promise<T | null> {
  if (!WEBSITE_BASE) return null;
  try {
    const headers = await buildHeaders(
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    );
    const res = await fetch(`${WEBSITE_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type Notice = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

export async function fetchPublicNotices(limit = 5): Promise<Notice[]> {
  const data = await getJson<{ items?: Notice[]; data?: Notice[] }>(
    `/api/v1/notices?limit=${limit}`,
  );
  if (!data) return [];
  return Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
}

export function formatNoticeDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ---------- Question Bank ----------
export type QBQuestion = {
  id: string;
  subject: string;
  topic: string | null;
  year: number | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  solution: string | null;
  imageUrl: string | null;
  solutionImageUrl: string | null;
};

export async function fetchQuestionBank(params: {
  subject?: string;
  pageSize?: number;
  search?: string;
  classGrade?: string;
  examTarget?: "JEE_MAIN" | "JEE_ADVANCED" | "NEET" | "CBSE_BOARDS" | "FOUNDATION";
  difficulty?: "easy" | "medium" | "hard";
  hasFigure?: boolean;
} = {}): Promise<{ items: QBQuestion[]; bookmarkedIds: string[] }> {
  const sp = new URLSearchParams();
  if (params.subject && params.subject !== "All") sp.set("subject", params.subject);
  if (params.search && params.search.trim()) sp.set("search", params.search.trim());
  if (params.classGrade) sp.set("classGrade", params.classGrade);
  if (params.examTarget) sp.set("examTarget", params.examTarget);
  if (params.difficulty) sp.set("difficulty", params.difficulty);
  if (params.hasFigure) sp.set("hasFigure", "1");
  sp.set("pageSize", String(params.pageSize ?? 50));
  const data = await getJson<{ items?: QBQuestion[]; bookmarkedIds?: string[] }>(
    `/api/v1/question-bank?${sp.toString()}`,
  );
  return {
    items: data?.items ?? [],
    bookmarkedIds: Array.isArray(data?.bookmarkedIds) ? data.bookmarkedIds : [],
  };
}

// ---------- SSC Public Question Bank ----------
export type SscQuestion = QBQuestion & {
  marks: number;
  language: string;
  questionTextHi: string | null;
  optionsHi: Record<string, string> | null;
  solutionHi: string | null;
  examTarget: string[] | null;
};

export type ExamTemplate = {
  id: string;
  code: string;
  name: string;
  examFamily: string;
  tier: string | null;
  totalDurationMinutes: number;
  marksPerCorrect: string;
  negativeMarks: string;
  description: string | null;
  totalQuestions: number;
  sections: { id: string; name: string; subject: string; questionCount: number; durationMinutes: number | null }[];
};

export async function fetchSscQuestionBank(params: {
  track?: "SSC_CGL" | "SSC_CHSL";
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ items: SscQuestion[]; total: number; page: number }> {
  const sp = new URLSearchParams();
  sp.set("track", params.track ?? "SSC_CGL");
  if (params.subject && params.subject !== "All") sp.set("subject", params.subject);
  if (params.difficulty) sp.set("difficulty", params.difficulty);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  const data = await getJson<{ items?: SscQuestion[]; total?: number; page?: number }>(
    `/api/v1/public/ssc/question-bank?${sp.toString()}`,
  );
  return { items: data?.items ?? [], total: data?.total ?? 0, page: data?.page ?? 1 };
}

export async function fetchSscExamTemplates(family?: "SSC_CGL" | "SSC_CHSL"): Promise<ExamTemplate[]> {
  const path = family
    ? `/api/v1/public/ssc/exam-templates?family=${family}`
    : `/api/v1/public/ssc/exam-templates`;
  const data = await getJson<{ items?: ExamTemplate[] }>(path);
  return data?.items ?? [];
}

export async function toggleQuestionBookmark(
  questionId: string,
  bookmark: boolean,
): Promise<boolean> {
  const data = await sendJson<{ success?: boolean; bookmarked?: boolean }>(
    `/api/v1/question-bank/${questionId}/bookmark`,
    bookmark ? "POST" : "DELETE",
  );
  return !!data?.success;
}

// ---------- Mock Tests ----------
export type MockTest = {
  id: string;
  title: string;
  subject: string;
  examType: string | null;
  durationMinutes: number;
  marksPerQuestion: number;
  isPublic: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  questionCount: number;
};

export async function fetchMockTests(): Promise<MockTest[]> {
  const data = await getJson<{ items?: MockTest[] }>(`/api/v1/mock-tests`);
  return data?.items ?? [];
}

export async function startMockTestAttempt(
  testId: string,
): Promise<{ attemptId: string } | null> {
  const data = await sendJson<{ success?: boolean; attemptId?: string }>(
    `/api/v1/mock-tests/${testId}/start`,
    "POST",
  );
  if (data?.success && typeof data.attemptId === "string") {
    return { attemptId: data.attemptId };
  }
  return null;
}

// ---------- Doubts ----------
export type DoubtTopAnswer = {
  id: string;
  answerText: string;
  authorRole: string;
  authorName: string | null;
  upvotes: number;
  isOfficial: boolean;
  voted: boolean;
};

export type DoubtFeedItem = {
  id: string;
  subject: string;
  topic: string | null;
  questionText: string;
  isResolved: boolean;
  answerCount: number;
  createdAt: string | null;
  studentName: string | null;
  topAnswer: DoubtTopAnswer | null;
};

export async function fetchDoubtsFeed(params: {
  subject?: string;
  status?: "open" | "resolved";
  mine?: boolean;
} = {}): Promise<DoubtFeedItem[]> {
  const sp = new URLSearchParams();
  if (params.subject && params.subject !== "All") sp.set("subject", params.subject);
  if (params.status) sp.set("status", params.status);
  if (params.mine) sp.set("mine", "1");
  const qs = sp.toString();
  const data = await getJson<{ items?: DoubtFeedItem[] }>(
    `/api/v1/doubts/feed${qs ? `?${qs}` : ""}`,
  );
  return data?.items ?? [];
}

export async function postDoubt(input: {
  subject: string;
  topic?: string;
  questionText: string;
}): Promise<boolean> {
  const data = await sendJson<{ success?: boolean }>(`/api/v1/doubts`, "POST", input);
  return !!data?.success;
}

export async function upvoteDoubtAnswer(
  doubtId: string,
  answerId: string,
): Promise<{ upvoted: boolean } | null> {
  const data = await sendJson<{ success?: boolean; upvoted?: boolean }>(
    `/api/v1/doubts/${doubtId}/answers/${answerId}/upvote`,
    "POST",
  );
  if (data?.success) return { upvoted: !!data.upvoted };
  return null;
}

// ---------- Recordings ----------
// Mobile counterpart to the web `/portal/student/recordings` flow. The
// website returns a student-scoped projection of `/api/v1/recordings`
// (no raw recordingUrl) plus a stream-url endpoint that hands out
// short-lived, single-use signed tokens. We then ask the proxy
// `/stream?token=...` endpoint to redirect us to the source URL — using
// `redirect: "manual"` so we read the Location header in JS and feed it
// straight to the player without persisting the proxy URL anywhere.
export type StudentRecording = {
  id: string;
  title: string;
  subject: string;
  teacherName: string | null;
  durationMinutes: number | null;
  viewCount: number;
  classDate: string | null;
  createdAt: string | null;
};

export type RecordingWatermark = {
  enabled: boolean;
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  cycleSeconds: number;
  anchors: string[];
};

export type RecordingStream = {
  streamUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  watermark: RecordingWatermark;
};

function websiteOrigin(): string | null {
  if (!WEBSITE_BASE) return null;
  try {
    return new URL(WEBSITE_BASE).origin;
  } catch {
    return null;
  }
}

/** Convert a server-relative URL like "/pinnacle-website/api/..." into an
 * absolute URL on the same origin as the website API. */
export function absoluteWebsiteUrl(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = websiteOrigin();
  if (!origin) return null;
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function fetchStudentRecordings(): Promise<StudentRecording[]> {
  const data = await getJson<{ data?: StudentRecording[] }>(`/api/v1/recordings`);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function requestRecordingStream(
  recordingId: string,
): Promise<RecordingStream | null> {
  const data = await sendJson<{ success?: boolean; data?: RecordingStream }>(
    `/api/v1/recordings/${recordingId}/stream-url`,
    "POST",
  );
  if (data?.success && data.data) return data.data;
  return null;
}

/**
 * Resolve the proxy stream URL into the underlying source URL by reading
 * the 302 Location header. Mobile WebViews can't carry our bearer token
 * to a same-origin GET, so we do the redirect dance in JS and hand the
 * resulting source URL to the player. This mirrors what the browser does
 * silently for the web build.
 */
export async function resolveRecordingSource(streamUrl: string): Promise<string | null> {
  const abs = absoluteWebsiteUrl(streamUrl);
  if (!abs) return null;
  try {
    const res = await fetch(abs, {
      method: "GET",
      headers: await buildHeaders(),
      credentials: "include",
      redirect: "manual",
    });
    // Some RN fetch impls follow redirects regardless; if the final URL
    // looks different from the proxy we just use it.
    const loc = res.headers.get("location");
    if (loc) return loc;
    if (res.url && res.url !== abs) return res.url;
    return null;
  } catch {
    return null;
  }
}

export async function postRecordingTelemetry(
  recordingId: string,
  event: "play_seek" | "watermark_removed",
  positionSec?: number,
): Promise<void> {
  await sendJson(`/api/v1/recordings/${recordingId}/telemetry`, "POST", {
    event,
    positionSec,
  });
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ---------- Fees ----------
export type FeeRecord = {
  id: string;
  period: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate: string | null;
  status: "due" | "partial" | "paid" | "overdue" | "waived";
  paymentMethod: string | null;
  transactionRef: string | null;
  notes: string | null;
};

export type FeeSummary = {
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  nextDue: string | null;
};

export async function fetchFees(): Promise<{ data: FeeRecord[]; summary: FeeSummary } | null> {
  const result = await getJson<{ ok: boolean; data: FeeRecord[]; summary: FeeSummary }>(
    `/api/v1/portal/fees`,
  );
  if (!result?.ok) return null;
  return { data: result.data ?? [], summary: result.summary };
}

export async function fetchFeeReceiptHtml(id: string): Promise<string | null> {
  if (!WEBSITE_BASE) return null;
  try {
    const headers = await buildHeaders();
    const res = await fetch(`${WEBSITE_BASE}/api/v1/portal/fees/receipt/${id}`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
