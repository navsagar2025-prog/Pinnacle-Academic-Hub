import { NextResponse } from "next/server";
import { NOTICES } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const category = searchParams.get("category");

  let notices = NOTICES;
  if (category) {
    notices = notices.filter((n) => n.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    data: notices.slice(0, limit),
    meta: {
      total: notices.length,
      limit,
      timestamp: new Date().toISOString(),
    },
  });
}
