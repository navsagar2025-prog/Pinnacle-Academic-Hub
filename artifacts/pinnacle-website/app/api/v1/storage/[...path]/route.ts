import { NextRequest } from "next/server";
import { streamObject } from "@/lib/server/object-storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const objectPath = `/objects/${path.join("/")}`;
  return streamObject(objectPath);
}
