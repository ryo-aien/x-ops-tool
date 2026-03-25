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

  if (!["admin", "approver"].includes(user.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const post = await prisma.post.update({
    where: { id: params.id, orgId: user.orgId },
    data: {
      status: "rejected",
      approverId: user.id,
      rejectReason: body.reason,
    },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.reject",
    targetType: "post",
    targetId: post.id,
    detail: `投稿を差し戻し: ${body.reason}`,
  });

  return NextResponse.json(post);
}
