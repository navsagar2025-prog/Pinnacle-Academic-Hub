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
} = {}): Promise<{ items: QBQuestion[]; bookmarkedIds: string[] }> {
  const sp = new URLSearchParams();
  if (params.subject && params.subject !== "All") sp.set("subject", params.subject);
  sp.set("pageSize", String(params.pageSize ?? 50));
  const data = await getJson<{ items?: QBQuestion[]; bookmarkedIds?: string[] }>(
    `/api/v1/question-bank?${sp.toString()}`,
  );
  return {
    items: data?.items ?? [],
    bookmarkedIds: Array.isArray(data?.bookmarkedIds) ? data.bookmarkedIds : [],
  };
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
