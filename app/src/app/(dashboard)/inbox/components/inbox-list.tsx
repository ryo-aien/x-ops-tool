"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDate,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  type: string;
  fromHandle: string;
  text: string;
  status: string;
  priority: string;
  receivedAt: Date;
  xAccount: { handle: string; name: string };
  assignee?: { name: string } | null;
}

interface InboxListProps {
  items: InboxItem[];
  summaryMap: Record<string, number>;
  teamMembers: { id: string; name: string }[];
}

const priorityColor: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-gray-100 text-gray-700 border-gray-200",
  low: "bg-gray-50 text-gray-500 border-gray-100",
};

const typeLabel: Record<string, string> = {
  mention: "メンション",
  reply: "返信",
  quote: "引用",
  dm: "DM",
};

export function InboxList({ items, summaryMap, teamMembers }: InboxListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("unread");

  const filtered = items.filter(
    (item) => activeTab === "all" || item.status === activeTab
  );

  const handleAssign = async (itemId: string, assigneeId: string) => {
    await fetch(`/api/inbox/${itemId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    router.refresh();
  };

  const handleDone = async (itemId: string) => {
    await fetch(`/api/inbox/${itemId}/done`, { method: "PATCH" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "unread", label: "未読", color: "bg-blue-50 text-blue-700" },
          { key: "assigned", label: "対応中", color: "bg-yellow-50 text-yellow-700" },
          { key: "done", label: "完了", color: "bg-green-50 text-green-700" },
          { key: "urgent", label: "緊急", color: "bg-red-50 text-red-700" },
        ].map(({ key, label, color }) => (
          <Card key={key}>
            <CardContent className={cn("p-3 text-center rounded-lg", color)}>
              <p className="text-2xl font-bold">
                {key === "urgent"
                  ? items.filter((i) => i.priority === "urgent").length
                  : summaryMap[key] || 0}
              </p>
              <p className="text-xs">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unread">
            未読 ({summaryMap.unread || 0})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            対応中 ({summaryMap.assigned || 0})
          </TabsTrigger>
          <TabsTrigger value="done">
            完了 ({summaryMap.done || 0})
          </TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="space-y-2 mt-4">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "border",
                  item.priority === "urgent" && "border-red-300 animate-pulse"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[item.type] || item.type}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs border",
                            priorityColor[item.priority]
                          )}
                          variant="outline"
                        >
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          @{item.xAccount.handle}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        @{item.fromHandle}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{formatDate(item.receivedAt)}</span>
                        {item.assignee && (
                          <span>担当: {item.assignee.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status !== "done" && (
                        <>
                          {teamMembers.length > 0 && item.status === "unread" && (
                            <Select
                              onValueChange={(v) => handleAssign(item.id, v)}
                            >
                              <SelectTrigger className="h-7 text-xs w-28">
                                <SelectValue placeholder="アサイン" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleDone(item.id)}
                          >
                            完了
                          </Button>
                        </>
                      )}
                      {item.status === "done" && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          {getStatusLabel(item.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>該当するアイテムはありません</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
