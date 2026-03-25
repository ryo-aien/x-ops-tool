import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (!["admin", "approver", "editor"].includes(user.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const keyword = await prisma.listeningKeyword.create({
    data: {
      orgId: user.orgId!,
      keyword: body.keyword,
      type: body.type || "custom",
      alertThreshold: body.alertThreshold,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(keyword, { status: 201 });
}
