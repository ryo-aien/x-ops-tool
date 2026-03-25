"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  PenSquare,
  Inbox,
  CheckSquare,
  BarChart3,
  Radio,
  Shield,
  AlertTriangle,
  Megaphone,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const XLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const navItems = [
  { href: "/accounts",  icon: Users,         label: "アカウント管理" },
  { href: "/compose",   icon: PenSquare,      label: "投稿作成" },
  { href: "/inbox",     icon: Inbox,          label: "受信箱" },
  { href: "/approval",  icon: CheckSquare,    label: "承認ワークフロー" },
  { href: "/analytics", icon: BarChart3,      label: "分析" },
  { href: "/listening", icon: Radio,          label: "リスニング" },
  { href: "/audit",     icon: Shield,         label: "監査ログ" },
  { href: "/guardrails",icon: AlertTriangle,  label: "ガードレール" },
  { href: "/campaigns", icon: Megaphone,      label: "キャンペーン" },
  { href: "/reports",   icon: FileText,       label: "レポート" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "#000", borderRight: "1px solid #2F3336" }}
      className="w-56 flex flex-col min-h-screen flex-shrink-0"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #2F3336" }}
      >
        <span style={{ color: "#E7E9EA" }}>
          <XLogo />
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#E7E9EA" }}>
            Multi-Account
          </p>
          <p className="text-xs" style={{ color: "#71767B" }}>
            Manager
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors font-medium",
                isActive
                  ? "font-bold"
                  : ""
              )}
              style={{
                color: isActive ? "#E7E9EA" : "#71767B",
                background: isActive ? "rgba(231,233,234,0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(231,233,234,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Team */}
      <div className="px-2 pb-4" style={{ borderTop: "1px solid #2F3336", paddingTop: "12px" }}>
        <Link
          href="/team"
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors"
          style={{ color: "#71767B" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(231,233,234,0.08)";
            (e.currentTarget as HTMLElement).style.color = "#E7E9EA";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#71767B";
          }}
        >
          <Users className="h-[18px] w-[18px] shrink-0" />
          チーム管理
        </Link>
      </div>
    </aside>
  );
}
