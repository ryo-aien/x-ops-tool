import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";

type Role = "approver" | "editor" | "viewer";
const ALLOWED_ROLES: Role[] = ["approver", "editor", "viewer"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const newRole: Role = body.role;

  if (!ALLOWED_ROLES.includes(newRole)) {
    return NextResponse.json(
      { error: "無効なロールです。approver / editor / viewer のいずれかを指定してください" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!target) {
    return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  }

  if (target.role === "admin") {
    return NextResponse.json({ error: "管理者のロールは変更できません" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: newRole },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "team.role_update",
    targetType: "user",
    targetId: id,
    detail: `${target.name} のロールを ${target.role} → ${newRole} に変更`,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 403 });
  }

  const target = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!target) {
    return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  }

  if (target.role === "admin") {
    return NextResponse.json({ error: "管理者は削除できません" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "team.member_remove",
    targetType: "user",
    targetId: id,
    detail: `${target.name} (${target.email}) をチームから削除`,
  });

  return NextResponse.json({ success: true });
}
