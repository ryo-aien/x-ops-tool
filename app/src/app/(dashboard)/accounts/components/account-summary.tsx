import { formatNumber } from "@/lib/utils";
import { Users, CheckCircle, MessageSquare, AlertCircle } from "lucide-react";

interface AccountSummaryProps {
  totalFollowers: number;
  activeCount: number;
  totalUnread: number;
  tokenExpired: number;
}

const statStyle = {
  background: "#16181C",
  border: "1px solid #2F3336",
};

export function AccountSummary({
  totalFollowers,
  activeCount,
  totalUnread,
  tokenExpired,
}: AccountSummaryProps) {
  const stats = [
    {
      label: "総フォロワー",
      value: formatNumber(totalFollowers),
      icon: Users,
      iconBg: "rgba(29,155,240,0.12)",
      iconColor: "#1D9BF0",
    },
    {
      label: "アクティブ",
      value: activeCount,
      icon: CheckCircle,
      iconBg: "rgba(0,186,124,0.12)",
      iconColor: "#00BA7C",
    },
    {
      label: "未返信",
      value: totalUnread,
      icon: MessageSquare,
      iconBg: "rgba(255,212,0,0.12)",
      iconColor: "#FFD400",
    },
    {
      label: "要トークン更新",
      value: tokenExpired,
      icon: AlertCircle,
      iconBg: "rgba(244,33,46,0.12)",
      iconColor: "#F4212E",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={statStyle}
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
          </div>
        );
      })}
    </div>
  );
}
