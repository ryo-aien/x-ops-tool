import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string; role?: string };

  if (!user?.id || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const level = searchParams.get("level") ?? undefined;   // info | warn | error
  const source = searchParams.get("source") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const logs = await prisma.systemLog.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(source ? { source } : {}),
      // orgId は NULL のものも含める（システム全体ログ）
      OR: [{ orgId: user.orgId }, { orgId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
