"use client";

import { formatNumber } from "@/lib/utils";
import { Users, CheckCircle, MessageSquare, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ExpiredAccount {
  handle: string;
  name: string;
  tokenExpiresAt: string;
}

interface AccountSummaryProps {
  totalFollowers: number;
  activeCount: number;
  totalUnread: number;
  tokenExpired: number;
  expiredAccounts?: ExpiredAccount[];
}

const statStyle = {
  background: "#16181C",
  border: "1px solid #2F3336",
};

function formatExpiredDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今日期限切れ";
  if (diffDays === 1) return "昨日期限切れ";
  return `${diffDays}日前に期限切れ`;
}

export function AccountSummary({
  totalFollowers,
  activeCount,
  totalUnread,
  tokenExpired,
  expiredAccounts = [],
}: AccountSummaryProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const stats = [
    {
      label: "総フォロワー",
      value: formatNumber(totalFollowers),
      icon: Users,
      iconBg: "rgba(29,155,240,0.12)",
      iconColor: "#1D9BF0",
      tooltip: null,
    },
    {
      label: "アクティブ",
      value: activeCount,
      icon: CheckCircle,
      iconBg: "rgba(0,186,124,0.12)",
      iconColor: "#00BA7C",
      tooltip: null,
    },
    {
      label: "未返信",
      value: totalUnread,
      icon: MessageSquare,
      iconBg: "rgba(255,212,0,0.12)",
      iconColor: "#FFD400",
      tooltip: null,
    },
    {
      label: "要トークン更新",
      value: tokenExpired,
      icon: AlertCircle,
      iconBg: "rgba(244,33,46,0.12)",
      iconColor: "#F4212E",
      tooltip: tokenExpired > 0 ? expiredAccounts : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        const hasTooltip = s.tooltip !== null && Array.isArray(s.tooltip) && s.tooltip.length > 0;

        return (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3 relative"
            style={{
              ...statStyle,
              cursor: hasTooltip ? "default" : undefined,
            }}
            onMouseEnter={() => hasTooltip && setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.iconBg }}
            >
              <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "#71767B" }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: "#E7E9EA" }}>{s.value}</p>
            </div>

            {hasTooltip && tooltipVisible && (
              <div
                className="absolute z-50 top-full left-0 mt-2 rounded-xl p-3 min-w-[220px] shadow-xl"
                style={{
                  background: "#1E2328",
                  border: "1px solid #2F3336",
                  color: "#E7E9EA",
                }}
              >
                {/* ツールチップの矢印（上向き） */}
                <div
                  className="absolute bottom-full left-6"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "6px solid #2F3336",
                  }}
                />
                <p className="text-xs font-semibold mb-2" style={{ color: "#F4212E" }}>
                  トークン更新が必要なアカウント
                </p>
                <ul className="space-y-2">
                  {(s.tooltip as ExpiredAccount[]).map((a) => (
                    <li key={a.handle} className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium" style={{ color: "#E7E9EA" }}>
                        {a.name}
                      </span>
                      <span className="text-xs" style={{ color: "#71767B" }}>
                        @{a.handle} · {formatExpiredDate(a.tokenExpiresAt)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs mt-2 pt-2" style={{ color: "#71767B", borderTop: "1px solid #2F3336" }}>
                  アカウントを再接続してください
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
