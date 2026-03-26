"use client";

import { Badge } from "@/components/ui/badge";

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  detail: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

const actionColor: Record<string, string> = {
  "post.create": "bg-blue-100 text-blue-700",
  "post.approve": "bg-green-100 text-green-700",
  "post.reject": "bg-red-100 text-red-700",
  "post.delete": "bg-red-100 text-red-700",
  "account.connect": "bg-purple-100 text-purple-700",
  "account.disconnect": "bg-orange-100 text-orange-700",
};

export function AuditTable({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <table className="w-full text-sm">
      <thead style={{ background: "#1E2124", borderBottom: "1px solid #2F3336" }}>
        <tr>
          <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: "#71767B" }}>日時</th>
          <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: "#71767B" }}>ユーザー</th>
          <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: "#71767B" }}>操作</th>
          <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: "#71767B" }}>対象</th>
          <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: "#71767B" }}>詳細</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr
            key={log.id}
            className="border-b transition-colors"
            style={{ borderColor: "#2F3336" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#272A2D"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            <td className="py-2.5 px-4 text-xs whitespace-nowrap" style={{ color: "#71767B" }}>
              {log.createdAt}
            </td>
            <td className="py-2.5 px-4 text-xs" style={{ color: "#E7E9EA" }}>
              {log.user?.name || "システム"}
            </td>
            <td className="py-2.5 px-4">
              <Badge
                className={`text-xs ${actionColor[log.action] || "bg-gray-100 text-gray-700"}`}
                variant="outline"
              >
                {log.action}
              </Badge>
            </td>
            <td className="py-2.5 px-4 text-xs" style={{ color: "#71767B" }}>{log.targetType}</td>
            <td className="py-2.5 px-4 text-xs" style={{ color: "#9CA3AF" }}>{log.detail}</td>
          </tr>
        ))}
        {logs.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center py-8" style={{ color: "#71767B" }}>
              ログがありません
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
