"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface Account {
  id: string;
  handle: string;
  name: string;
}

interface Snapshot {
  id: string;
  xAccountId: string;
  date: Date;
  impressions: number;
  engagements: number;
  likes: number;
  retweets: number;
  replies: number;
  clicks: number;
  followers: number;
  xAccount: { handle: string; name: string };
}

interface AnalyticsDashboardProps {
  accounts: Account[];
  snapshots: Snapshot[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export function AnalyticsDashboard({
  accounts,
  snapshots,
}: AnalyticsDashboardProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const filtered =
    selectedAccount === "all"
      ? snapshots
      : snapshots.filter((s) => s.xAccountId === selectedAccount);

  // 日付ごとに集計
  const byDate = filtered.reduce(
    (acc, s) => {
      const dateStr = new Date(s.date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      });
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, impressions: 0, engagements: 0, followers: 0 };
      }
      acc[dateStr].impressions += s.impressions;
      acc[dateStr].engagements += s.engagements;
      acc[dateStr].followers += s.followers;
      return acc;
    },
    {} as Record<string, { date: string; impressions: number; engagements: number; followers: number }>
  );

  const chartData = Object.values(byDate);

  // 合計KPI
  const totals = filtered.reduce(
    (acc, s) => {
      acc.impressions += s.impressions;
      acc.engagements += s.engagements;
      acc.likes += s.likes;
      acc.retweets += s.retweets;
      acc.replies += s.replies;
      acc.clicks += s.clicks;
      return acc;
    },
    { impressions: 0, engagements: 0, likes: 0, retweets: 0, replies: 0, clicks: 0 }
  );

  const engageRate =
    totals.impressions > 0
      ? ((totals.engagements / totals.impressions) * 100).toFixed(2)
      : "0";

  // 横断比較テーブルデータ
  const compareTable = accounts.map((acc, idx) => {
    const accSnaps = snapshots.filter((s) => s.xAccountId === acc.id);
    const totImp = accSnaps.reduce((s, a) => s + a.impressions, 0);
    const totEng = accSnaps.reduce((s, a) => s + a.engagements, 0);
    const latestFollowers = accSnaps[accSnaps.length - 1]?.followers ?? 0;
    return {
      ...acc,
      impressions: totImp,
      engagements: totEng,
      followers: latestFollowers,
      color: COLORS[idx % COLORS.length],
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="アカウント選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全アカウント</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                @{acc.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">過去7日間</span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "インプレッション", value: formatNumber(totals.impressions) },
          { label: "エンゲージメント", value: formatNumber(totals.engagements) },
          { label: "エンゲージ率", value: `${engageRate}%` },
          { label: "いいね", value: formatNumber(totals.likes) },
          { label: "リツイート", value: formatNumber(totals.retweets) },
          { label: "クリック", value: formatNumber(totals.clicks) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* インプレッションチャート */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">インプレッション推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatNumber(Number(v))]} />
              <Bar dataKey="impressions" fill="#3b82f6" name="インプレッション" />
              <Bar dataKey="engagements" fill="#10b981" name="エンゲージメント" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 横断比較テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">アカウント横断比較</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-gray-500">アカウント</th>
                <th className="text-right py-2 px-3 text-xs text-gray-500">インプレッション</th>
                <th className="text-right py-2 px-3 text-xs text-gray-500">エンゲージメント</th>
                <th className="text-right py-2 px-3 text-xs text-gray-500">フォロワー</th>
              </tr>
            </thead>
            <tbody>
              {compareTable.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: row.color }}
                      />
                      @{row.handle}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">{formatNumber(row.impressions)}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(row.engagements)}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(row.followers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
