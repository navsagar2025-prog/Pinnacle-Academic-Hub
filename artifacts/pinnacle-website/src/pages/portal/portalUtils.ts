import {
  useState, useEffect, useCallback, useContext,
  createContext, useRef, ReactNode, createElement,
} from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Debounce ──────────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Modal Escape key ──────────────────────────────────────────────────────────
export function useModalEscape(onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, enabled]);
}

// ── Toast system ──────────────────────────────────────────────────────────────
type ToastItem = { id: string; type: "success" | "error" | "info"; message: string };
type ToastCtx = { toast: (type: ToastItem["type"], message: string) => void };

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((type: ToastItem["type"], message: string) => {
    const id = String(++idRef.current);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  const BG: Record<ToastItem["type"], string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-[#0A1F5C]",
  };
  const ICON: Record<ToastItem["type"], string> = {
    success: "✓", error: "✕", info: "ℹ",
  };

  return createElement(
    ToastContext.Provider,
    { value: { toast } },
    children,
    createElement(
      "div",
      { className: "fixed bottom-5 right-5 z-[9999] space-y-2 pointer-events-none" },
      ...toasts.map(t =>
        createElement(
          "div",
          {
            key: t.id,
            onClick: () => dismiss(t.id),
            className: `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white cursor-pointer animate-in slide-in-from-right-8 fade-in duration-300 ${BG[t.type]}`,
          },
          createElement("span", { className: "font-bold" }, ICON[t.type]),
          t.message,
        )
      ),
    ),
  );
}

export function useToast() { return useContext(ToastContext); }

// ── Skeleton loaders ──────────────────────────────────────────────────────────
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return createElement(
    "div",
    { className: "space-y-2" },
    ...[...Array(rows)].map((_, i) =>
      createElement("div", {
        key: i,
        className: "animate-pulse rounded-xl bg-slate-100 h-[68px]",
      })
    ),
  );
}

export function SkeletonCards({ n = 4 }: { n?: number }) {
  return createElement(
    "div",
    { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
    ...[...Array(n)].map((_, i) =>
      createElement("div", {
        key: i,
        className: "animate-pulse rounded-xl bg-slate-100 h-28",
      })
    ),
  );
}

// ── useSectionFetch — uses json.data (for all section components) ─────────────
export function useSectionFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: string = path) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ── apiMutation — returns { ok, data?, error? } ───────────────────────────────
export async function apiMutation(
  method: string,
  path: string,
  body: object | null,
  getToken: () => Promise<string | null>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  return { ok: res.ok, ...json };
}

// ── Legacy exports (unchanged — kept for AdminDashboard inline sections) ──────
export function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export async function apiCall(
  method: string,
  path: string,
  body: object | null,
  getToken: () => Promise<string | null>,
) {
  return apiMutation(method, path, body, getToken);
}
