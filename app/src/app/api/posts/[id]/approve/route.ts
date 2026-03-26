import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";
import { publishPost } from "@/lib/x/publisher";
import { writeSystemLog, errorToLog } from "@/lib/logger/system";

export async function PATCH(
  _req: NextRequest,
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

  // 投稿を取得して scheduledAt を確認
  const existing = await prisma.post.findUnique({
    where: { id: params.id, orgId: user.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasSchedule =
    existing.scheduledAt && existing.scheduledAt > new Date();

  if (hasSchedule) {
    // 予約日時が設定されている場合 → scheduled ステータスにして待機
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        status: "scheduled",
        approverId: user.id,
      },
    });

    await writeAuditLog({
      orgId: user.orgId!,
      userId: user.id,
      action: "post.approve",
      targetType: "post",
      targetId: post.id,
      detail: `投稿を承認（予約: ${existing.scheduledAt!.toISOString()}）`,
    });

    return NextResponse.json({ post, publishResults: null, scheduled: true });
  }

  // 予約なし → 承認後に即時投稿
  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      status: "approved",
      approverId: user.id,
    },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.approve",
    targetType: "post",
    targetId: post.id,
    detail: "投稿を承認（即時投稿）",
  });

  // X API へ投稿実行
  let publishResults;
  try {
    publishResults = await publishPost(params.id);
  } catch (err) {
    console.error("投稿実行エラー:", err);
    await writeSystemLog(
      errorToLog(err, {
        source: "approve",
        detail: `postId: ${params.id}`,
        postId: params.id,
        userId: user.id,
        orgId: user.orgId,
      })
    );
    return NextResponse.json(
      { error: "投稿の実行中にエラーが発生しました" },
      { status: 500 }
    );
  }

  const updatedPost = await prisma.post.findUnique({
    where: { id: params.id },
  });

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "post.publish",
    targetType: "post",
    targetId: params.id,
    detail: publishResults.every((r) => r.success)
      ? "X への投稿が完了しました"
      : `一部の投稿に失敗: ${publishResults
          .filter((r) => !r.success)
          .map((r) => r.error)
          .join(", ")}`,
  });

  return NextResponse.json({
    post: updatedPost,
    publishResults,
    scheduled: false,
  });
}
