import { NextResponse } from "next/server";
import { COURSES } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: COURSES,
    meta: {
      total: COURSES.length,
      timestamp: new Date().toISOString(),
    },
  });
}
