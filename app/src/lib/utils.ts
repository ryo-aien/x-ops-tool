import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number | bigint): string {
  return Number(num).toLocaleString("ja-JP");
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "下書き",
    pending: "承認待ち",
    approved: "承認済み",
    rejected: "差し戻し",
    scheduled: "予約済み",
    published: "公開済み",
    failed: "失敗",
    active: "アクティブ",
    paused: "停止中",
    planned: "計画中",
    completed: "完了",
    unread: "未読",
    assigned: "アサイン済み",
    done: "対応完了",
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    urgent: "緊急",
    high: "高",
    normal: "通常",
    low: "低",
  };
  return labels[priority] || priority;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "管理者",
    approver: "承認者",
    editor: "投稿者",
    viewer: "閲覧者",
  };
  return labels[role] || role;
}
