import { getAccessToken } from "@/lib/x/auth";

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
 * @param xAccountId  DBアカウントID（トークンの自動リフレッシュ対応）
 * @param text        投稿テキスト
 */
export async function postTweet(
  xAccountId: string,
  text: string
): Promise<TweetResult | TweetError> {
  let accessToken: string;
  try {
    ({ accessToken } = await getAccessToken(xAccountId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "トークンの取得に失敗しました" };
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
