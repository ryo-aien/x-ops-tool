import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; orgId?: string };
  const orgId = user.orgId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const accounts = await prisma.xAccount.findMany({
    where: { orgId },
    include: {
      _count: {
        select: {
          inboxItems: {
            where: { status: "unread" },
          },
        },
      },
      analyticsSnapshots: {
        orderBy: { date: "desc" },
        take: 7,
        select: { date: true, followers: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const result = accounts.map((acc) => ({
    ...acc,
    unreadCount: acc._count.inboxItems,
    followersHistory: acc.analyticsSnapshots,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as {
    id: string;
    orgId?: string;
    role?: string;
  };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const account = await prisma.xAccount.create({
    data: {
      orgId: user.orgId!,
      xUserId: body.xUserId,
      handle: body.handle,
      name: body.name,
      avatarUrl: body.avatarUrl,
      verified: body.verified ?? false,
      category: body.category,
      tokenEncrypted: body.tokenEncrypted || "pending",
      tokenExpiresAt: body.tokenExpiresAt
        ? new Date(body.tokenExpiresAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "account.connect",
    targetType: "x_account",
    targetId: account.id,
    detail: `アカウント @${account.handle} を接続`,
  });

  return NextResponse.json(account, { status: 201 });
}
