import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  const body = await req.json();

  const existing = await prisma.post.findUnique({
    where: { id: params.id, orgId: user.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    existing.authorId !== user.id &&
    user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      status: body.status,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      rejectReason: body.status === "pending" ? null : undefined,
    },
  });

  if (body.variants && Array.isArray(body.variants)) {
    for (const v of body.variants as { id: string; text: string }[]) {
      await prisma.postVariant.update({
        where: { id: v.id },
        data: { text: v.text },
      });
    }
  }

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.update",
    targetType: "post",
    targetId: post.id,
    detail: `投稿編集`,
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };

  const existing = await prisma.post.findUnique({
    where: { id: params.id, orgId: user.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    existing.authorId !== user.id &&
    user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.id } });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.delete",
    targetType: "post",
    targetId: params.id,
  });

  return NextResponse.json({ success: true });
}
