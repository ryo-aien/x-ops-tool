"use client";

import { formatDate, formatNumber } from "@/lib/utils";
import { CheckCircle, XCircle, Pause } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AccountCardProps {
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
    lastPostAt?: Date | null;
    unreadCount: number;
    followersHistory: { date: Date; followers: number }[];
  };
}

export function AccountCard({ account }: AccountCardProps) {
  const isTokenExpired = new Date(account.tokenExpiresAt) < new Date();
  const chartData = account.followersHistory
    .slice()
    .reverse()
    .map((h) => ({ followers: h.followers }));

  const initial = account.handle.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-colors"
      style={{
        background: "#16181C",
        border: "1px solid #2F3336",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#1C1F23";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#16181C";
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: "#1D9BF022", color: "#1D9BF0" }}
          >
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm" style={{ color: "#E7E9EA" }}>
                {account.name}
              </span>
              {account.verified && (
                <CheckCircle className="h-3.5 w-3.5" style={{ color: "#1D9BF0" }} />
              )}
            </div>
            <span className="text-xs" style={{ color: "#71767B" }}>
              @{account.handle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {account.status === "active" ? (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#00BA7C" }}
              aria-label="接続中"
            />
          ) : (
            <Pause className="h-3 w-3" style={{ color: "#536471" }} aria-label="停止中" />
          )}
          {isTokenExpired && (
            <XCircle className="h-3 w-3" style={{ color: "#F4212E" }} aria-label="トークン期限切れ" />
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {account.category && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(29,155,240,0.12)", color: "#1D9BF0" }}
          >
            {account.category}
          </span>
        )}
        {account.unreadCount > 0 && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(244,33,46,0.12)", color: "#F4212E" }}
          >
            未読 {account.unreadCount}
          </span>
        )}
        {account.status !== "active" && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(83,100,113,0.2)", color: "#536471" }}
          >
            停止中
          </span>
        )}
      </div>

      {/* Followers + chart */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "#71767B" }}>フォロワー</p>
          <p className="text-lg font-bold" style={{ color: "#E7E9EA" }}>
            {formatNumber(account.followersCount)}
          </p>
        </div>
        {chartData.length > 1 && (
          <div className="w-24 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="#1D9BF0"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Tooltip
                  contentStyle={{ background: "#16181C", border: "1px solid #2F3336", borderRadius: 8, color: "#E7E9EA", fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), "フォロワー"]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Last post */}
      <p className="text-xs" style={{ color: "#536471" }}>
        最終投稿: {formatDate(account.lastPostAt)}
      </p>
    </div>
  );
}
