import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { decrypt } from "@/lib/crypto/token";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; orgId?: string };
  const { id } = await params;

  const account = await prisma.xAccount.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = decrypt(account.tokenEncrypted);
  } catch {
    return NextResponse.json({ error: "トークンの復号化に失敗しました" }, { status: 500 });
  }

  // X API v2: ユーザープロフィール詳細取得
  const userRes = await fetch(
    `https://api.twitter.com/2/users/${account.xUserId}?user.fields=description,profile_image_url,public_metrics,verified,entities`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!userRes.ok) {
    const body = await userRes.text();
    return NextResponse.json(
      { error: `X API エラー (${userRes.status}): ${body}` },
      { status: userRes.status }
    );
  }

  const userData = (await userRes.json()) as {
    data?: {
      description?: string;
      profile_image_url?: string;
      public_metrics?: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
        listed_count: number;
      };
      verified?: boolean;
      entities?: {
        url?: { urls?: { expanded_url?: string }[] };
        description?: { urls?: { expanded_url?: string; display_url?: string; url?: string }[] };
      };
    };
  };

  // X API v2: 最近のツイート取得（最大5件）
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${account.xUserId}/tweets?max_results=5&tweet.fields=created_at,public_metrics,text&exclude=replies,retweets`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  let tweets: {
    id: string;
    text: string;
    created_at?: string;
    public_metrics?: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      impression_count: number;
    };
  }[] = [];

  if (tweetsRes.ok) {
    const tweetsData = (await tweetsRes.json()) as { data?: typeof tweets };
    tweets = tweetsData.data ?? [];
  }

  return NextResponse.json({
    description: userData.data?.description ?? null,
    profileImageUrl: userData.data?.profile_image_url ?? account.avatarUrl,
    publicMetrics: userData.data?.public_metrics ?? null,
    tweets,
  });
}
