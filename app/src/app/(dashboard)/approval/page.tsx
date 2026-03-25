import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { ApprovalList } from "./components/approval-list";

export default async function ApprovalPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string; role?: string };

  const [pendingPosts, approvedPosts, rejectedPosts, draftPosts] = await Promise.all([
    prisma.post.findMany({
      where: { orgId: user.orgId, status: "pending" },
      include: {
        variants: { include: { xAccount: { select: { handle: true, name: true } } } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { orgId: user.orgId, status: { in: ["approved", "scheduled"] } },
      include: {
        variants: { include: { xAccount: { select: { handle: true, name: true } } } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.post.findMany({
      where: { orgId: user.orgId, status: "rejected" },
      include: {
        variants: { include: { xAccount: { select: { handle: true, name: true } } } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.post.findMany({
      where: { orgId: user.orgId, status: "draft" },
      include: {
        variants: { include: { xAccount: { select: { handle: true, name: true } } } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const canApprove = ["admin", "approver"].includes(user.role || "");

  return (
    <div className="flex flex-col h-full">
      <Header
        title="投稿承認ワークフロー"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <ApprovalList
          pendingPosts={pendingPosts}
          approvedPosts={approvedPosts}
          rejectedPosts={rejectedPosts}
          draftPosts={draftPosts}
          canApprove={canApprove}
        />
      </div>
    </div>
  );
}
