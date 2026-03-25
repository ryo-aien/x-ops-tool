"use client";

import { Bell, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

interface HeaderProps {
  title: string;
  userEmail?: string;
  userName?: string;
}

export function Header({ title, userEmail, userName }: HeaderProps) {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "#000",
        borderBottom: "1px solid #2F3336",
      }}
    >
      <h2 className="text-base font-bold" style={{ color: "#E7E9EA" }}>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ color: "#71767B" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(231,233,234,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#E7E9EA";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#71767B";
          }}
        >
          <Bell className="h-4 w-4" />
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ color: "#71767B" }}
        >
          <User className="h-4 w-4" />
          <span>{userName || userEmail}</span>
        </div>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ color: "#71767B" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="ログアウト"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(244,33,46,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#F4212E";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#71767B";
          }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
