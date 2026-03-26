"use client";

import { formatNumber } from "@/lib/utils";
import { CheckCircle, Pause, XCircle, Calendar } from "lucide-react";

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
    bio?: string | null;
    lastPostAt?: Date | null;
  };
}

export function XProfilePreview({ account }: XProfilePreviewProps) {
  const isTokenExpired = new Date(account.tokenExpiresAt) < new Date();
  const initial = account.handle.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-2xl overflow-hidden h-full"
      style={{ background: "#000", border: "1px solid #2F3336", minHeight: 480 }}
    >
      {/* ヘッダーバナー */}
      <div
        className="h-32 w-full relative flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #1D9BF022 0%, #1D9BF044 100%)" }}
      />

      {/* プロフィールセクション */}
      <div className="px-4 pb-4">
        {/* アバター */}
        <div className="relative -mt-10 mb-3 flex items-end justify-between">
          <div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{
              background: "#1D9BF022",
              color: "#1D9BF0",
              borderColor: "#000",
            }}
          >
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.avatarUrl}
                alt={account.name}
                className="w-full h-full rounded-full object-cover"
              />
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
        <div className="mb-3">
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

        {/* Bio */}
        {account.bio && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: "#E7E9EA" }}>
            {account.bio}
          </p>
        )}

        {/* 最終投稿 */}
        {account.lastPostAt && (
          <div className="flex items-center gap-1.5 mb-4">
            <Calendar className="w-4 h-4" style={{ color: "#71767B" }} />
            <span className="text-sm" style={{ color: "#71767B" }}>
              最終投稿: {new Date(account.lastPostAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
        )}

        {/* フォロワー / フォロー中 */}
        <div
          className="flex items-center gap-6 pt-3"
          style={{ borderTop: "1px solid #2F3336" }}
        >
          <div>
            <span className="font-bold text-base" style={{ color: "#E7E9EA" }}>
              {formatNumber(account.followersCount)}
            </span>
            <span className="text-sm ml-1.5" style={{ color: "#71767B" }}>
              フォロワー
            </span>
          </div>
          <div>
            <span className="font-bold text-base" style={{ color: "#E7E9EA" }}>
              {formatNumber(account.followingCount)}
            </span>
            <span className="text-sm ml-1.5" style={{ color: "#71767B" }}>
              フォロー中
            </span>
          </div>
        </div>
      </div>

      {/* ダミーポストエリア */}
      <div style={{ borderTop: "1px solid #2F3336" }}>
        {/* タブ風ナビ */}
        <div className="flex" style={{ borderBottom: "1px solid #2F3336" }}>
          {["投稿", "返信", "メディア", "いいね"].map((tab, i) => (
            <div
              key={tab}
              className="flex-1 text-center py-3 text-sm font-medium relative"
              style={{
                color: i === 0 ? "#E7E9EA" : "#71767B",
                cursor: "default",
              }}
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

        {/* プレビューメッセージ */}
        <div className="py-10 text-center" style={{ color: "#536471" }}>
          <p className="text-sm">投稿はダッシュボードで管理されます</p>
        </div>
      </div>
    </div>
  );
}
