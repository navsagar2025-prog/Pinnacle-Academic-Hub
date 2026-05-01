import { NextRequest, NextResponse } from "next/server";
import { streamObject, isPublicObjectPath } from "@/lib/server/object-storage";
import { getDbUser } from "@/lib/server/portal-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // path segments already include "objects/..." from the serving URL, so just join with leading slash
  const objectPath = `/${path.join("/")}`;

  const isPublic = isPublicObjectPath(objectPath);

  if (!isPublic) {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden — private file" }, { status: 403 });
    }
  }

  return streamObject(objectPath);
}
