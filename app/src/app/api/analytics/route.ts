import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string };

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const days = parseInt(searchParams.get("days") || "7");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // アカウント検証
  const orgAccounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    select: { id: true },
  });
  const validAccountIds = orgAccounts.map((a) => a.id);

  const where: Record<string, unknown> = {
    xAccountId: accountId
      ? { in: validAccountIds.includes(accountId) ? [accountId] : [] }
      : { in: validAccountIds },
    date: { gte: startDate },
  };

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where,
    include: {
      xAccount: { select: { handle: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  // BigInt を数値に変換してシリアライズ
  const result = snapshots.map((s) => ({
    ...s,
    impressions: Number(s.impressions),
  }));

  return NextResponse.json(result);
}
