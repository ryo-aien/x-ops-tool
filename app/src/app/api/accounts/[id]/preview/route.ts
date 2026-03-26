import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getAccessToken } from "@/lib/x/auth";

type RouteContext = { params: Promise<{ id: string }> };

// DBキャッシュを返す
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; orgId?: string };
  const { id } = await params;

  const account = await prisma.xAccount.findFirst({
    where: { id, orgId: user.orgId },
    include: { previewCache: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!account.previewCache) {
    return NextResponse.json({ cached: null });
  }

  return NextResponse.json({
    cached: {
      description: account.previewCache.description,
      profileImageUrl: account.previewCache.profileImageUrl,
      publicMetrics: {
        followers_count: account.previewCache.followersCount,
        following_count: account.previewCache.followingCount,
        tweet_count: account.previewCache.tweetCount,
      },
      tweets: account.previewCache.tweetsJson,
      fetchedAt: account.previewCache.fetchedAt,
    },
  });
}

// X APIを叩いてDBに保存（手動更新）
export async function POST(_req: NextRequest, { params }: RouteContext) {
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
    ({ accessToken } = await getAccessToken(id));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "トークンの取得に失敗しました" },
      { status: 401 }
    );
  }

  // X API v2: ユーザープロフィール
  const userRes = await fetch(
    `https://api.twitter.com/2/users/${account.xUserId}?user.fields=description,profile_image_url,public_metrics,verified`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
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
      };
    };
  };

  // X API v2: 最近のツイート（最大5件・返信/RT除外）
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${account.xUserId}/tweets?max_results=5&tweet.fields=created_at,public_metrics,text&exclude=replies,retweets`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  type Tweet = {
    id: string;
    text: string;
    created_at?: string;
    public_metrics?: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      impression_count: number;
    };
  };

  let tweets: Tweet[] = [];
  if (tweetsRes.ok) {
    const tweetsData = (await tweetsRes.json()) as { data?: Tweet[] };
    tweets = tweetsData.data ?? [];
  }

  const d = userData.data;
  const cache = await prisma.xAccountPreviewCache.upsert({
    where: { xAccountId: id },
    create: {
      xAccountId: id,
      description: d?.description ?? null,
      profileImageUrl: d?.profile_image_url ?? null,
      followersCount: d?.public_metrics?.followers_count ?? 0,
      followingCount: d?.public_metrics?.following_count ?? 0,
      tweetCount: d?.public_metrics?.tweet_count ?? 0,
      tweetsJson: tweets,
      fetchedAt: new Date(),
    },
    update: {
      description: d?.description ?? null,
      profileImageUrl: d?.profile_image_url ?? null,
      followersCount: d?.public_metrics?.followers_count ?? 0,
      followingCount: d?.public_metrics?.following_count ?? 0,
      tweetCount: d?.public_metrics?.tweet_count ?? 0,
      tweetsJson: tweets,
      fetchedAt: new Date(),
    },
  });

  return NextResponse.json({
    cached: {
      description: cache.description,
      profileImageUrl: cache.profileImageUrl,
      publicMetrics: {
        followers_count: cache.followersCount,
        following_count: cache.followingCount,
        tweet_count: cache.tweetCount,
      },
      tweets: cache.tweetsJson,
      fetchedAt: cache.fetchedAt,
    },
  });
}
