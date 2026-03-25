import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";
import { checkGuardrails } from "@/lib/guardrails/engine";
import type { GuardrailRule } from "@/lib/guardrails/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; orgId?: string };
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { orgId: user.orgId };
  if (status) where.status = status;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        variants: { include: { xAccount: { select: { handle: true, name: true } } } },
        author: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

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
  const { variants, status, scheduledAt, campaignId } = body;

  // ガードレールチェック
  const guardrails = await prisma.guardrail.findMany({
    where: { orgId: user.orgId, enabled: true },
  });

  for (const variant of variants) {
    const result = checkGuardrails(
      { text: variant.text, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
      guardrails as GuardrailRule[]
    );
    if (!result.passed) {
      return NextResponse.json(
        { error: "ガードレール違反", violations: result.violations },
        { status: 422 }
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      orgId: user.orgId!,
      status: status || "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      authorId: user.id,
      campaignId: campaignId || undefined,
      variants: {
        create: variants.map((v: { xAccountId: string; text: string; mediaUrls?: string[] }) => ({
          xAccountId: v.xAccountId,
          text: v.text,
          mediaUrls: v.mediaUrls || [],
        })),
      },
    },
    include: {
      variants: { include: { xAccount: { select: { handle: true, name: true } } } },
    },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.create",
    targetType: "post",
    targetId: post.id,
    detail: `投稿作成 ステータス: ${post.status}`,
  });

  return NextResponse.json(post, { status: 201 });
}
