import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const MOCK_MATERIALS = [
  { id: 1, subject: "Physics", title: "Wave Optics — Complete Notes", type: "Notes", date: "2026-04-25", size: "2.4 MB", batch: "JEE 2026" },
  { id: 2, subject: "Chemistry", title: "Organic Chemistry — Haloalkanes", type: "Notes", date: "2026-04-23", size: "1.8 MB", batch: "JEE 2026" },
  { id: 3, subject: "Mathematics", title: "Integral Calculus — Formula Sheet", type: "Formula", date: "2026-04-22", size: "0.8 MB", batch: "JEE 2026" },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: MOCK_MATERIALS,
    meta: {
      total: MOCK_MATERIALS.length,
      timestamp: new Date().toISOString(),
    },
  });
}
