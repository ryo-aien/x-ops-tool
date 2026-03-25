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
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const accountId = searchParams.get("accountId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const orgAccounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    select: { id: true },
  });
  const accountIds = accountId
    ? [accountId]
    : orgAccounts.map((a) => a.id);

  const where: Record<string, unknown> = {
    xAccountId: { in: accountIds },
  };
  if (status) where.status = status;
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.inboxItem.findMany({
      where,
      include: {
        xAccount: { select: { handle: true, name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [
        { priority: "asc" },
        { receivedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inboxItem.count({ where }),
  ]);

  const summary = await prisma.inboxItem.groupBy({
    by: ["status"],
    where: { xAccountId: { in: accountIds } },
    _count: { id: true },
  });

  return NextResponse.json({ items, total, page, limit, summary });
}
