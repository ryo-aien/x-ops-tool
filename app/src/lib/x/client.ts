import { decrypt } from "@/lib/crypto/token";

export interface TweetResult {
  xTweetId: string;
  error?: undefined;
}

export interface TweetError {
  xTweetId?: undefined;
  error: string;
}

/**
 * X API v2 でツイートを投稿する
 * @param tokenEncrypted  暗号化済みアクセストークン
 * @param text            投稿テキスト
 * @returns               成功時は xTweetId、失敗時は error
 */
export async function postTweet(
  tokenEncrypted: string,
  text: string
): Promise<TweetResult | TweetError> {
  let accessToken: string;
  try {
    accessToken = decrypt(tokenEncrypted);
  } catch {
    return { error: "トークンの復号化に失敗しました" };
  }

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `X API エラー (${res.status}): ${body}` };
  }

  const json = (await res.json()) as { data?: { id?: string } };
  const tweetId = json?.data?.id;
  if (!tweetId) {
    return { error: "X API からツイートIDが返されませんでした" };
  }

  return { xTweetId: tweetId };
}
