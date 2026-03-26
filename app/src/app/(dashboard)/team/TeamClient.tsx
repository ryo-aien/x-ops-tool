"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoleLabel } from "@/lib/utils";

type Role = "admin" | "approver" | "editor" | "viewer";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date | string;
}

interface TeamClientProps {
  initialMembers: Member[];
  currentUserId: string;
}

const roleColor: Record<Role, string> = {
  admin: "bg-red-100 text-red-700",
  approver: "bg-orange-100 text-orange-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-700",
};

const EDITABLE_ROLES: { value: Role; label: string }[] = [
  { value: "approver", label: "承認者" },
  { value: "editor", label: "投稿者" },
  { value: "viewer", label: "閲覧者" },
];

export function TeamClient({ initialMembers, currentUserId }: TeamClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [error, setError] = useState<string | null>(null);

  // 招待ダイアログ
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // ロール変更ダイアログ
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState<Role>("viewer");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 削除確認ダイアログ
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- 招待 ---
  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteError("メールアドレスを入力してください");
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "招待に失敗しました");
        return;
      }
      setMembers((prev) => [...prev, data]);
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("viewer");
    } catch {
      setInviteError("通信エラーが発生しました");
    } finally {
      setInviteLoading(false);
    }
  }

  // --- ロール変更 ---
  function openEdit(member: Member) {
    setEditMember(member);
    setEditRole(member.role);
    setEditError(null);
  }

  async function handleEditRole() {
    if (!editMember) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/team/${editMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "ロール変更に失敗しました");
        return;
      }
      setMembers((prev) => prev.map((m) => (m.id === editMember.id ? data : m)));
      setEditMember(null);
    } catch {
      setEditError("通信エラーが発生しました");
    } finally {
      setEditLoading(false);
    }
  }

  // --- 削除 ---
  async function handleDelete() {
    if (!deleteMember) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${deleteMember.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "削除に失敗しました");
        setDeleteMember(null);
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== deleteMember.id));
      setDeleteMember(null);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {/* ツールバー */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{members.length} 名のメンバー</p>
        <Button onClick={() => { setShowInvite(true); setInviteError(null); }}>
          メンバーを追加
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* メンバー一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                <div className="mt-1">
                  <Badge className={`text-xs ${roleColor[member.role] || ""}`} variant="outline">
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
              </div>
              {member.role !== "admin" && (
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => openEdit(member)}
                  >
                    ロール変更
                  </Button>
                  {member.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setDeleteMember(member)}
                    >
                      削除
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 招待ダイアログ */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="invite-name">名前</Label>
              <Input
                id="invite-name"
                placeholder="山田 太郎"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-email">メールアドレス <span className="text-red-500">*</span></Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="example@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-role">ロール</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-red-600">{inviteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              キャンセル
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ロール変更ダイアログ */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ロールを変更</DialogTitle>
          </DialogHeader>
          {editMember && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{editMember.name}</span> のロールを変更します
              </p>
              <div className="space-y-1">
                <Label htmlFor="edit-role">新しいロール</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>
              キャンセル
            </Button>
            <Button onClick={handleEditRole} disabled={editLoading}>
              {editLoading ? "変更中..." : "変更する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteMember} onOpenChange={(open) => { if (!open) setDeleteMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを削除</DialogTitle>
          </DialogHeader>
          {deleteMember && (
            <p className="text-sm text-gray-600 py-2">
              <span className="font-medium">{deleteMember.name}</span>（{deleteMember.email}）をチームから削除しますか？この操作は取り消せません。
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMember(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
