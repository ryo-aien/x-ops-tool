"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, getStatusLabel } from "@/lib/utils";
import Link from "next/link";

interface PostVariant {
  id: string;
  text: string;
  xAccount: { handle: string; name: string };
}

interface Post {
  id: string;
  status: string;
  scheduledAt?: Date | null;
  rejectReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: PostVariant[];
  author: { name: string; email: string };
}

interface ApprovalListProps {
  pendingPosts: Post[];
  approvedPosts: Post[];
  rejectedPosts: Post[];
  draftPosts: Post[];
  canApprove: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  scheduled: "default",
  published: "success",
};

export function ApprovalList({
  pendingPosts,
  approvedPosts,
  rejectedPosts,
  draftPosts,
  canApprove,
}: ApprovalListProps) {
  const router = useRouter();
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (postId: string) => {
    await fetch(`/api/posts/${postId}/approve`, { method: "PATCH" });
    router.refresh();
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    await fetch(`/api/posts/${rejectDialog}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectDialog(null);
    setRejectReason("");
    router.refresh();
  };

  const PostCard = ({
    post,
    showActions,
  }: {
    post: Post;
    showActions: boolean;
  }) => (
    <Card key={post.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusVariant[post.status] || "secondary"}>
                {getStatusLabel(post.status)}
              </Badge>
              <span className="text-xs text-gray-500">
                作成者: {post.author.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(post.updatedAt)}
              </span>
            </div>
            {post.variants.map((v) => (
              <div key={v.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  @{v.xAccount.handle}
                </p>
                <p className="text-sm text-gray-800">{v.text}</p>
              </div>
            ))}
            {post.rejectReason && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                差し戻し理由: {post.rejectReason}
              </div>
            )}
            {post.status === "rejected" && (
              <div className="mt-2">
                <Link href={`/compose?editPostId=${post.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    修正して再申請
                  </Button>
                </Link>
              </div>
            )}
            {post.scheduledAt && (
              <p className="text-xs text-gray-500 mt-1">
                予約: {formatDate(post.scheduledAt)}
              </p>
            )}
          </div>
          {showActions && canApprove && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300"
                onClick={() => setRejectDialog(post.id)}
              >
                差し戻し
              </Button>
              <Button size="sm" onClick={() => handleApprove(post.id)}>
                承認
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            承認待ち ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            承認済み ({approvedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            差し戻し ({rejectedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            下書き ({draftPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingPosts.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              承認待ちの投稿はありません
            </p>
          ) : (
            pendingPosts.map((p) => (
              <PostCard key={p.id} post={p} showActions={true} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedPosts.map((p) => (
            <PostCard key={p.id} post={p} showActions={false} />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedPosts.map((p) => (
            <PostCard key={p.id} post={p} showActions={false} />
          ))}
        </TabsContent>

        <TabsContent value="draft" className="mt-4">
          {draftPosts.map((p) => (
            <PostCard key={p.id} post={p} showActions={false} />
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent style={{ background: "#1E2124", borderColor: "#2F3336" }}>
          <DialogHeader>
            <DialogTitle>差し戻し理由を入力</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="修正が必要な理由を記入してください..."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              差し戻す
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
