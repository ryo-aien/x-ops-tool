import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; orgId?: string };
  const orgId = user.orgId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const body = await req.json();
  const { orderedIds } = body as { orderedIds: string[] };

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 各アカウントが同じorgに属することを確認しつつ一括更新
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.xAccount.updateMany({
        where: { id, orgId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
