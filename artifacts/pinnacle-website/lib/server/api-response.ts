import { NextResponse } from "next/server";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};

export function ok<T>(data: T, meta: Record<string, unknown> | null = null, status = 200) {
  return NextResponse.json<ApiEnvelope<T>>(
    { success: true, data, error: null, meta },
    { status }
  );
}

export function created<T>(data: T) {
  return ok(data, null, 201);
}

export function err(message: string, status = 500) {
  return NextResponse.json<ApiEnvelope<null>>(
    { success: false, data: null, error: message, meta: null },
    { status }
  );
}

export function paginatedOk<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return ok(data, { total, page, limit, pages: Math.ceil(total / Math.max(limit, 1)) });
}
