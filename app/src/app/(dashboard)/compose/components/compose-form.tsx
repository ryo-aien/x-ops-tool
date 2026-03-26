"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  handle: string;
  name: string;
  verified: boolean;
}

interface Campaign {
  id: string;
  name: string;
}

interface PostVariant {
  id: string;
  text: string;
  xAccount: { id: string; handle: string; name: string; verified: boolean };
}

interface EditPost {
  id: string;
  rejectReason?: string | null;
  variants: PostVariant[];
}

interface ComposeFormProps {
  accounts: Account[];
  campaigns: Campaign[];
  editPost?: EditPost | null;
}

const MAX_CHARS = 280;

export function ComposeForm({ accounts, campaigns, editPost }: ComposeFormProps) {
  const router = useRouter();

  const initialSelectedAccounts = editPost ? editPost.variants.map((v) => v.xAccount.id) : [];
  const initialPerAccountText = editPost
    ? Object.fromEntries(editPost.variants.map((v) => [v.xAccount.id, v.text]))
    : {};

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(initialSelectedAccounts);
  const [sharedText, setSharedText] = useState(editPost?.variants[0]?.text ?? "");
  const [perAccountText, setPerAccountText] = useState<Record<string, string>>(initialPerAccountText);
  const [usePerAccount, setUsePerAccount] = useState(editPost ? editPost.variants.length > 1 : false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const getTextForAccount = (accountId: string) =>
    usePerAccount ? (perAccountText[accountId] || sharedText) : sharedText;

  const handleSubmit = async (actionStatus: string) => {
    if (selectedAccounts.length === 0) {
      setErrors(["配信先アカウントを選択してください"]);
      return;
    }

    const textEmpty = selectedAccounts.some((id) => !getTextForAccount(id).trim());
    if (textEmpty) {
      setErrors(["投稿テキストを入力してください"]);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    let res: Response;

    if (editPost) {
      // 編集モード：既存variantのテキストを更新して再申請
      const variants = editPost.variants.map((v) => ({
        id: v.id,
        text: getTextForAccount(v.xAccount.id),
      }));
      res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionStatus, variants }),
      });
    } else {
      const variants = selectedAccounts.map((id) => ({
        xAccountId: id,
        text: getTextForAccount(id),
      }));
      res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants,
          status: actionStatus,
          scheduledAt: scheduledAt || undefined,
          campaignId: (campaignId && campaignId !== "none") ? campaignId : undefined,
        }),
      });
    }

    setSubmitting(false);

    if (res.ok) {
      router.push("/approval");
    } else {
      const data = await res.json();
      if (data.violations) {
        setErrors(data.violations.map((v: { message: string }) => v.message));
      } else {
        setErrors([data.error || "投稿の保存に失敗しました"]);
      }
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* 差し戻し理由 */}
      {editPost?.rejectReason && (
        <div className="p-3 rounded-md border border-red-300 bg-red-950 text-red-300 text-sm">
          <span className="font-medium">差し戻し理由：</span>{editPost.rejectReason}
        </div>
      )}

      {/* アカウント選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">配信先アカウント</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(editPost ? editPost.variants.map((v) => v.xAccount) : accounts).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => !editPost && toggleAccount(acc.id)}
                disabled={!!editPost}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors",
                  selectedAccounts.includes(acc.id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400",
                  editPost && "opacity-70 cursor-default"
                )}
              >
                {acc.verified && <CheckCircle className="h-3 w-3" />}
                @{acc.handle}
              </button>
            ))}
          </div>
          {selectedAccounts.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePerAccount}
                  onChange={(e) => setUsePerAccount(e.target.checked)}
                  className="rounded"
                />
                アカウント別文面差替
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 投稿テキスト */}
      {!usePerAccount ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">投稿テキスト（共通）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sharedText}
              onChange={(e) => setSharedText(e.target.value)}
              placeholder="ここに投稿内容を入力..."
              rows={5}
              maxLength={MAX_CHARS}
            />
            <div
              className={cn(
                "text-right text-xs mt-1",
                sharedText.length > MAX_CHARS ? "text-red-500" : "text-gray-500"
              )}
            >
              {sharedText.length} / {MAX_CHARS}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedAccounts.map((id) => {
            const acc = accounts.find((a) => a.id === id);
            if (!acc) return null;
            const text = perAccountText[id] || "";
            return (
              <Card key={id}>
                <CardHeader>
                  <CardTitle className="text-sm">@{acc.handle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={text}
                    onChange={(e) =>
                      setPerAccountText((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    placeholder={sharedText || `@${acc.handle} への投稿内容...`}
                    rows={4}
                    maxLength={MAX_CHARS}
                  />
                  <div
                    className={cn(
                      "text-right text-xs mt-1",
                      text.length > MAX_CHARS ? "text-red-500" : "text-gray-500"
                    )}
                  >
                    {text.length} / {MAX_CHARS}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 予約・キャンペーン */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">予約・設定</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              予約日時
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
            />
          </div>
          {campaigns.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                キャンペーン
              </label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="キャンペーンを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* エラー */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">
              ⚠ {e}
            </p>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={submitting}
        >
          下書き保存
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("pending")}
          disabled={submitting}
        >
          承認依頼
        </Button>
        {scheduledAt && (
          <Button
            onClick={() => handleSubmit("scheduled")}
            disabled={submitting}
          >
            予約する
          </Button>
        )}
        <Badge variant="secondary" className="self-center">
          {selectedAccounts.length} アカウント選択中
        </Badge>
      </div>
    </div>
  );
}
