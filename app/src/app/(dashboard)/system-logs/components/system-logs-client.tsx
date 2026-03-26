"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, AlertTriangle, Info, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface SystemLog {
  id: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  detail: string | null;
  stack: string | null;
  postId: string | null;
  accountId: string | null;
  createdAt: string;
}

const LEVEL_STYLES = {
  error: {
    row: "bg-red-950/30 border-l-2 border-red-500",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: AlertCircle,
    iconColor: "#ef4444",
    label: "ERROR",
  },
  warn: {
    row: "bg-yellow-950/20 border-l-2 border-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    icon: AlertTriangle,
    iconColor: "#eab308",
    label: "WARN",
  },
  info: {
    row: "border-l-2 border-transparent",
    badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    icon: Info,
    iconColor: "#3b82f6",
    label: "INFO",
  },
};

const SOURCE_COLORS: Record<string, string> = {
  publisher: "#a78bfa",
  approve:   "#34d399",
  oauth:     "#fb923c",
  guardrails:"#f472b6",
  cron:      "#60a5fa",
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source] ?? "#71767B";
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

type LevelFilter = "all" | "error" | "warn" | "info";

export function SystemLogsClient() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [source, setSource] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "300" });
      if (level !== "all") params.set("level", level);
      if (source !== "all") params.set("source", source);
      const res = await fetch(`/api/system-logs?${params}`);
      if (!res.ok) return;
      const data: SystemLog[] = await res.json();
      setLogs(data);
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  }, [level, source]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchLogs]);

  const sources = Array.from(new Set(logs.map((l) => l.source)));

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount  = logs.filter((l) => l.level === "warn").length;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* ステータスバー */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm flex-shrink-0"
        style={{ background: "#16181C", border: "1px solid #2F3336" }}
      >
        <span className="font-mono text-xs" style={{ color: "#71767B" }}>
          {lastFetched ? `最終取得: ${lastFetched.toLocaleTimeString("ja-JP")}` : "取得中..."}
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            ERROR {errorCount}
          </span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}>
            WARN {warnCount}
          </span>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors"
            style={{
              background: autoRefresh ? "rgba(0,186,124,0.15)" : "rgba(113,118,123,0.15)",
              color: autoRefresh ? "#00BA7C" : "#71767B",
            }}
          >
            {autoRefresh ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {autoRefresh ? "自動更新 ON" : "自動更新 OFF"}
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
            style={{ background: "rgba(231,233,234,0.08)", color: "#E7E9EA" }}
          >
            <RefreshCw className="h-3 w-3" />
            更新
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* レベルフィルター */}
        <div className="flex gap-1">
          {(["all", "error", "warn", "info"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
              style={{
                background: level === l ? "rgba(231,233,234,0.15)" : "transparent",
                color: level === l ? "#E7E9EA" : "#71767B",
                border: "1px solid",
                borderColor: level === l ? "#2F3336" : "transparent",
              }}
            >
              {l === "all" ? "すべて" : l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ width: "1px", height: "16px", background: "#2F3336" }} />
        {/* ソースフィルター */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSource("all")}
            className="text-xs px-3 py-1 rounded-full transition-colors"
            style={{
              background: source === "all" ? "rgba(231,233,234,0.15)" : "transparent",
              color: source === "all" ? "#E7E9EA" : "#71767B",
              border: "1px solid",
              borderColor: source === "all" ? "#2F3336" : "transparent",
            }}
          >
            全ソース
          </button>
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className="text-xs px-3 py-1 rounded-full transition-colors font-mono"
              style={{
                background: source === s ? "rgba(231,233,234,0.15)" : "transparent",
                color: source === s ? sourceColor(s) : "#71767B",
                border: "1px solid",
                borderColor: source === s ? "#2F3336" : "transparent",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ログ一覧 */}
      <div
        className="flex-1 overflow-auto rounded-xl font-mono text-xs"
        style={{ background: "#0D0D0D", border: "1px solid #2F3336" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32" style={{ color: "#71767B" }}>
            読み込み中...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: "#71767B" }}>
            <Info className="h-6 w-6" />
            <span>ログがありません</span>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0" style={{ background: "#111315", borderBottom: "1px solid #2F3336" }}>
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium whitespace-nowrap" style={{ color: "#71767B", width: "130px" }}>日時</th>
                <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "#71767B", width: "60px" }}>レベル</th>
                <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "#71767B", width: "90px" }}>ソース</th>
                <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "#71767B" }}>メッセージ</th>
                <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "#71767B", width: "80px" }}>postId</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const s = LEVEL_STYLES[log.level];
                const Icon = s.icon;
                const isExpanded = expanded.has(log.id);
                const hasDetail = log.detail || log.stack;

                return (
                  <>
                    <tr
                      key={log.id}
                      className={`${s.row} ${hasDetail ? "cursor-pointer" : ""}`}
                      style={{ borderBottom: "1px solid #1a1a1a" }}
                      onClick={() => hasDetail && toggleExpand(log.id)}
                    >
                      <td className="py-1.5 px-3 whitespace-nowrap" style={{ color: "#71767B" }}>
                        {fmt(log.createdAt)}
                      </td>
                      <td className="py-1.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${s.badge}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {s.label}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 font-mono" style={{ color: sourceColor(log.source) }}>
                        {log.source}
                      </td>
                      <td className="py-1.5 px-3" style={{ color: log.level === "error" ? "#fca5a5" : log.level === "warn" ? "#fde68a" : "#E7E9EA" }}>
                        <span>{log.message}</span>
                        {hasDetail && (
                          <span className="ml-2 text-[10px]" style={{ color: "#71767B" }}>
                            {isExpanded ? "▲ 折り畳む" : "▼ 詳細"}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-3" style={{ color: "#71767B" }}>
                        {log.postId ? (
                          <span title={log.postId}>{log.postId.slice(0, 8)}…</span>
                        ) : "-"}
                      </td>
                    </tr>
                    {isExpanded && hasDetail && (
                      <tr key={`${log.id}-detail`} style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
                        <td colSpan={5} className="px-4 py-3">
                          {log.detail && (
                            <div className="mb-2">
                              <span className="text-[10px] font-bold mr-2" style={{ color: "#71767B" }}>DETAIL</span>
                              <span style={{ color: "#d1d5db" }}>{log.detail}</span>
                            </div>
                          )}
                          {log.stack && (
                            <div>
                              <span className="text-[10px] font-bold mr-2" style={{ color: "#71767B" }}>STACK TRACE</span>
                              <pre
                                className="mt-1 text-[10px] leading-relaxed overflow-x-auto p-2 rounded"
                                style={{ background: "#0D0D0D", color: "#ef4444", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                              >
                                {log.stack}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
