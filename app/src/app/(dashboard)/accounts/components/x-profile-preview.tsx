"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { CheckCircle, Pause, XCircle, Heart, Repeat2, MessageCircle, BarChart2 } from "lucide-react";

interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count: number;
  };
}

interface PreviewData {
  description: string | null;
  profileImageUrl: string | null;
  publicMetrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  } | null;
  tweets: Tweet[];
}

interface XProfilePreviewProps {
  account: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string | null;
    verified: boolean;
    category?: string | null;
    status: string;
    tokenExpiresAt: Date;
    followersCount: number;
    followingCount: number;
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "今";
  if (mins < 60) return `${mins}分`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間`;
  const days = Math.floor(hours / 24);
  return `${days}日`;
}

export function XProfilePreview({ account }: XProfilePreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTokenExpired = new Date(account.tokenExpiresAt) < new Date();
  const initial = account.handle.charAt(0).toUpperCase();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/accounts/${account.id}/preview`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json as PreviewData);
        }
      })
      .catch(() => setError("データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [account.id]);

  const avatarUrl = data?.profileImageUrl?.replace("_normal", "_400x400") ?? account.avatarUrl;
  const followers = data?.publicMetrics?.followers_count ?? account.followersCount;
  const following = data?.publicMetrics?.following_count ?? account.followingCount;
  const tweetCount = data?.publicMetrics?.tweet_count ?? null;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "#000", border: "1px solid #2F3336", minHeight: 480 }}
    >
      {/* ヘッダーバナー */}
      <div
        className="h-32 w-full flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #1D9BF022 0%, #1D9BF055 100%)" }}
      />

      {/* プロフィールセクション */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="relative -mt-10 mb-3 flex items-end justify-between">
          {/* アバター */}
          <div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center font-bold text-2xl flex-shrink-0 overflow-hidden"
            style={{ borderColor: "#000", background: "#1D9BF022", color: "#1D9BF0" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={account.name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>

          {/* ステータスバッジ */}
          <div className="flex items-center gap-2 pb-1">
            {account.status === "active" ? (
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,186,124,0.12)", color: "#00BA7C" }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00BA7C" }} />
                接続中
              </span>
            ) : (
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(83,100,113,0.2)", color: "#536471" }}
              >
                <Pause className="w-3 h-3" />
                停止中
              </span>
            )}
            {isTokenExpired && (
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(244,33,46,0.12)", color: "#F4212E" }}
              >
                <XCircle className="w-3 h-3" />
                トークン期限切れ
              </span>
            )}
          </div>
        </div>

        {/* 名前・ハンドル */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold" style={{ color: "#E7E9EA" }}>
              {account.name}
            </span>
            {account.verified && (
              <CheckCircle className="w-5 h-5" style={{ color: "#1D9BF0" }} />
            )}
          </div>
          <span className="text-sm" style={{ color: "#71767B" }}>
            @{account.handle}
          </span>
        </div>

        {/* Bio */}
        {loading ? (
          <div className="h-4 w-3/4 rounded mb-3 animate-pulse" style={{ background: "#2F3336" }} />
        ) : data?.description ? (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: "#E7E9EA" }}>
            {data.description}
          </p>
        ) : null}

        {/* カテゴリ */}
        {account.category && (
          <div className="mb-3">
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(29,155,240,0.12)", color: "#1D9BF0" }}
            >
              {account.category}
            </span>
          </div>
        )}

        {/* フォロワー / フォロー中 / ツイート数 */}
        <div className="flex items-center gap-5 pt-3" style={{ borderTop: "1px solid #2F3336" }}>
          <div>
            <span className="font-bold text-sm" style={{ color: "#E7E9EA" }}>
              {formatNumber(followers)}
            </span>
            <span className="text-sm ml-1" style={{ color: "#71767B" }}>フォロワー</span>
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "#E7E9EA" }}>
              {formatNumber(following)}
            </span>
            <span className="text-sm ml-1" style={{ color: "#71767B" }}>フォロー中</span>
          </div>
          {tweetCount !== null && (
            <div>
              <span className="font-bold text-sm" style={{ color: "#E7E9EA" }}>
                {formatNumber(tweetCount)}
              </span>
              <span className="text-sm ml-1" style={{ color: "#71767B" }}>ポスト</span>
            </div>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid #2F3336" }}>
        {["ポスト", "返信", "メディア", "いいね"].map((tab, i) => (
          <div
            key={tab}
            className="flex-1 text-center py-3 text-sm font-medium relative"
            style={{ color: i === 0 ? "#E7E9EA" : "#71767B" }}
          >
            {tab}
            {i === 0 && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full"
                style={{ background: "#1D9BF0" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ツイート一覧 */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#2F3336" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: "#2F3336" }} />
                  <div className="h-3 w-full rounded animate-pulse" style={{ background: "#2F3336" }} />
                  <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "#2F3336" }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm" style={{ color: "#F4212E" }}>
            {error}
          </div>
        ) : data?.tweets.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "#536471" }}>
            ポストがありません
          </div>
        ) : (
          <div>
            {data?.tweets.map((tweet, i) => (
              <div
                key={tweet.id}
                className="px-4 py-3 flex gap-3"
                style={{
                  borderBottom: i < (data.tweets.length - 1) ? "1px solid #2F3336" : "none",
                }}
              >
                {/* アバター */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                  style={{ background: "#1D9BF022", color: "#1D9BF0" }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={account.name} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* ヘッダー */}
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-bold text-sm" style={{ color: "#E7E9EA" }}>
                      {account.name}
                    </span>
                    {account.verified && (
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: "#1D9BF0" }} />
                    )}
                    <span className="text-sm" style={{ color: "#71767B" }}>
                      @{account.handle}
                    </span>
                    {tweet.created_at && (
                      <>
                        <span style={{ color: "#71767B" }}>·</span>
                        <span className="text-sm" style={{ color: "#71767B" }}>
                          {timeAgo(tweet.created_at)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* テキスト */}
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap" style={{ color: "#E7E9EA" }}>
                    {tweet.text}
                  </p>

                  {/* エンゲージメント */}
                  {tweet.public_metrics && (
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#71767B" }}>
                        <MessageCircle className="w-3.5 h-3.5" />
                        {formatNumber(tweet.public_metrics.reply_count)}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#71767B" }}>
                        <Repeat2 className="w-3.5 h-3.5" />
                        {formatNumber(tweet.public_metrics.retweet_count)}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#71767B" }}>
                        <Heart className="w-3.5 h-3.5" />
                        {formatNumber(tweet.public_metrics.like_count)}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#71767B" }}>
                        <BarChart2 className="w-3.5 h-3.5" />
                        {formatNumber(tweet.public_metrics.impression_count)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
