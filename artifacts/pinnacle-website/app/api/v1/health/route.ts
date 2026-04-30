import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      version: "1.0.0",
      service: "Pinnacle Academic Classes API",
      timestamp: new Date().toISOString(),
    },
    error: null,
    meta: null,
  });
}
