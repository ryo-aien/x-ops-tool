import { prisma } from "@/lib/db/client";
import { postTweet } from "@/lib/x/client";
import { writeSystemLog } from "@/lib/logger/system";

export interface PublishResult {
  variantId: string;
  xAccountId: string;
  success: boolean;
  xTweetId?: string;
  error?: string;
}

/**
 * Post の全 Variant を X API へ投稿し、結果を DB に反映する。
 * 全 Variant の投稿完了後に Post.status を published / failed へ更新する。
 */
export async function publishPost(postId: string): Promise<PublishResult[]> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      variants: {
        include: { xAccount: true },
      },
    },
  });

  if (!post) {
    await writeSystemLog({
      level: "error",
      source: "publisher",
      message: `投稿が見つかりません: ${postId}`,
      postId,
    });
    throw new Error(`Post not found: ${postId}`);
  }

  const results: PublishResult[] = [];

  for (const variant of post.variants) {
    const { xAccount } = variant;

    if (xAccount.status !== "active") {
      const msg = `アカウント @${xAccount.handle} は停止中です`;
      await writeSystemLog({
        level: "warn",
        source: "publisher",
        message: msg,
        postId,
        accountId: xAccount.id,
        orgId: post.orgId,
      });
      results.push({
        variantId: variant.id,
        xAccountId: xAccount.id,
        success: false,
        error: msg,
      });
      continue;
    }

    await writeSystemLog({
      level: "info",
      source: "publisher",
      message: `X API へ投稿開始: @${xAccount.handle}`,
      postId,
      accountId: xAccount.id,
      orgId: post.orgId,
    });

    const result = await postTweet(xAccount.id, variant.text);

    if (result.error) {
      await writeSystemLog({
        level: "error",
        source: "publisher",
        message: `X API 投稿失敗: @${xAccount.handle}`,
        detail: result.error,
        postId,
        accountId: xAccount.id,
        orgId: post.orgId,
      });
      results.push({
        variantId: variant.id,
        xAccountId: xAccount.id,
        success: false,
        error: result.error,
      });
    } else {
      await prisma.postVariant.update({
        where: { id: variant.id },
        data: { xTweetId: result.xTweetId },
      });
      await writeSystemLog({
        level: "info",
        source: "publisher",
        message: `X API 投稿成功: @${xAccount.handle} (tweetId: ${result.xTweetId})`,
        postId,
        accountId: xAccount.id,
        orgId: post.orgId,
      });
      results.push({
        variantId: variant.id,
        xAccountId: xAccount.id,
        success: true,
        xTweetId: result.xTweetId,
      });
    }
  }

  const allSucceeded = results.every((r) => r.success);
  const anySucceeded = results.some((r) => r.success);

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: allSucceeded ? "published" : anySucceeded ? "published" : "failed",
      publishedAt: anySucceeded ? new Date() : undefined,
    },
  });

  return results;
}
