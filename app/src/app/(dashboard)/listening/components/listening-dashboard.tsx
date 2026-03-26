"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Mention {
  id: string;
  text: string;
  sentiment: number;
  authorHandle?: string | null;
  createdAt: Date;
}

interface Keyword {
  id: string;
  keyword: string;
  type: string;
  alertThreshold?: number | null;
  enabled: boolean;
  createdAt: Date;
  _count: { mentions: number };
  mentions: Mention[];
}

interface ListeningDashboardProps {
  keywords: Keyword[];
  orgId: string;
}

const typeLabels: Record<string, string> = {
  brand: "自社",
  hashtag: "ハッシュタグ",
  competitor: "競合",
  risk: "リスク",
  industry: "業界",
  custom: "カスタム",
};

const typeColors: Record<string, string> = {
  brand: "bg-blue-100 text-blue-700",
  hashtag: "bg-purple-100 text-purple-700",
  competitor: "bg-orange-100 text-orange-700",
  risk: "bg-red-100 text-red-700",
  industry: "bg-green-100 text-green-700",
  custom: "bg-gray-100 text-gray-700",
};

export function ListeningDashboard({ keywords }: ListeningDashboardProps) {
  const router = useRouter();
  const [newKeyword, setNewKeyword] = useState("");
  const [newType, setNewType] = useState("custom");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);
    await fetch("/api/listening/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: newKeyword.trim(), type: newType }),
    });
    setNewKeyword("");
    setAdding(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/listening/keywords/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const getSentimentBar = (sentiment: number) => {
    const positive = Math.round(sentiment * 100);
    const negative = 100 - positive;
    return { positive, negative };
  };

  return (
    <div className="space-y-6">
      {/* キーワード追加 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">キーワード追加</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="監視するキーワードを入力..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={adding || !newKeyword.trim()}>
              追加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* キーワード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keywords.map((kw) => {
          const sentimentAvg =
            kw.mentions.length > 0
              ? kw.mentions.reduce((s, m) => s + m.sentiment, 0) / kw.mentions.length
              : 0.5;
          const { positive, negative } = getSentimentBar(sentimentAvg);

          return (
            <Card key={kw.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{kw.keyword}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${typeColors[kw.type] || typeColors.custom}`}
                      >
                        {typeLabels[kw.type] || kw.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      言及数: {kw._count.mentions}件
                      {kw.alertThreshold && ` / 閾値: ${kw.alertThreshold}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={kw.enabled} disabled />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(kw.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* センチメントバー */}
                {kw.mentions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">センチメント</p>
                    <div className="flex h-2 rounded overflow-hidden">
                      <div
                        className="bg-green-400"
                        style={{ width: `${positive}%` }}
                        title={`ポジティブ ${positive}%`}
                      />
                      <div
                        className="bg-red-400"
                        style={{ width: `${negative}%` }}
                        title={`ネガティブ ${negative}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>ポジティブ {positive}%</span>
                      <span>ネガティブ {negative}%</span>
                    </div>
                  </div>
                )}

                {/* 最新メンション */}
                {kw.mentions.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className="text-xs bg-gray-50 p-2 rounded border border-gray-100"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {m.authorHandle && (
                        <span className="font-medium text-gray-600">
                          @{m.authorHandle}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {formatDate(m.createdAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${m.sentiment > 0.6 ? "text-green-600" : m.sentiment < 0.4 ? "text-red-600" : "text-gray-600"}`}
                      >
                        {m.sentiment > 0.6 ? "😊" : m.sentiment < 0.4 ? "😞" : "😐"}
                      </Badge>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{m.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
        {keywords.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <p>監視キーワードが設定されていません</p>
          </div>
        )}
      </div>
    </div>
  );
}
