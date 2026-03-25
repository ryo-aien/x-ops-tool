"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface Guardrail {
  id: string;
  name: string;
  type: string;
  configJson: JsonValue;
  enabled: boolean;
}

interface GuardrailListProps {
  guardrails: Guardrail[];
  canEdit: boolean;
}

const typeLabels: Record<string, string> = {
  content: "コンテンツ",
  media: "メディア",
  link: "リンク",
  schedule: "スケジュール",
  legal: "法務",
};

const typeColors: Record<string, string> = {
  content: "bg-blue-100 text-blue-700",
  media: "bg-purple-100 text-purple-700",
  link: "bg-green-100 text-green-700",
  schedule: "bg-orange-100 text-orange-700",
  legal: "bg-red-100 text-red-700",
};

export function GuardrailList({ guardrails, canEdit }: GuardrailListProps) {
  const router = useRouter();

  const handleToggle = async (id: string, enabled: boolean) => {
    if (!canEdit) return;
    await fetch(`/api/guardrails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    router.refresh();
  };

  const activeCount = guardrails.filter((g) => g.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>{activeCount} / {guardrails.length} ルール有効</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardrails.map((rule) => (
          <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {rule.enabled ? (
                    <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-gray-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{rule.name}</p>
                    <Badge
                      className={`text-xs mt-1 ${typeColors[rule.type] || ""}`}
                      variant="outline"
                    >
                      {typeLabels[rule.type] || rule.type}
                    </Badge>
                    <div className="mt-2 text-xs text-gray-500">
                      {rule.configJson && typeof rule.configJson === "object" && !Array.isArray(rule.configJson) && Object.entries(rule.configJson as Record<string, JsonValue>).map(([k, v]) => (
                        <p key={k}>
                          <span className="font-medium">{k}:</span>{" "}
                          {Array.isArray(v) ? (v as string[]).join(", ") : String(v)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {guardrails.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            ガードレールルールが設定されていません
          </div>
        )}
      </div>
    </div>
  );
}
