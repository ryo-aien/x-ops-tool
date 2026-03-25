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

  const user = session.user as {
    id: string;
    orgId?: string;
    role?: string;
  };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const account = await prisma.xAccount.update({
    where: { id: params.id, orgId: user.orgId },
    data: { status: body.status },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "account.update",
    targetType: "x_account",
    targetId: account.id,
    detail: `ステータス変更: ${body.status}`,
  });

  return NextResponse.json(account);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const account = await prisma.xAccount.delete({
    where: { id: params.id, orgId: user.orgId },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "account.disconnect",
    targetType: "x_account",
    targetId: params.id,
    detail: `アカウント @${account.handle} を削除`,
  });

  return NextResponse.json({ success: true });
}
