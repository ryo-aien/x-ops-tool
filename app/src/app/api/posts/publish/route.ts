import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/logger";
import { publishPost } from "@/lib/x/publisher";

/**
 * POST /api/posts/publish
 *
 * scheduledAt が現在時刻を過ぎた "scheduled" 投稿を一括実行する。
 * cron ジョブから定期的に呼び出す想定（例: 毎分）。
 *
 * CRON_SECRET 環境変数を Authorization ヘッダーで検証する。
 * 例: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  // シークレット検証（未設定の場合はローカル開発用として通過）
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // 投稿時刻を迎えた scheduled 投稿を取得
  const duePosts = await prisma.post.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    select: { id: true, orgId: true, approverId: true },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const summaries = [];

  for (const post of duePosts) {
    try {
      const results = await publishPost(post.id);
      const allOk = results.every((r) => r.success);

      await writeAuditLog({
        orgId: post.orgId,
        userId: post.approverId ?? undefined,
        action: "post.publish",
        targetType: "post",
        targetId: post.id,
        detail: allOk
          ? "スケジュール投稿が完了しました"
          : `一部の投稿に失敗: ${results
              .filter((r) => !r.success)
              .map((r) => r.error)
              .join(", ")}`,
      });

      summaries.push({ postId: post.id, success: allOk, results });
    } catch (err) {
      console.error(`スケジュール投稿エラー (postId: ${post.id}):`, err);
      // エラー時も failed に更新
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "failed" },
      });
      summaries.push({
        postId: post.id,
        success: false,
        error: String(err),
      });
    }
  }

  return NextResponse.json({ processed: duePosts.length, summaries });
}
