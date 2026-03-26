import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { ComposeForm } from "./components/compose-form";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: { editPostId?: string };
}) {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const [accounts, campaigns] = await Promise.all([
    prisma.xAccount.findMany({
      where: { orgId: user.orgId, status: "active" },
      select: { id: true, handle: true, name: true, verified: true },
      orderBy: { name: "asc" },
    }),
    prisma.campaign.findMany({
      where: { orgId: user.orgId, status: { in: ["planned", "active"] } },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  let editPost = null;
  if (searchParams.editPostId) {
    editPost = await prisma.post.findUnique({
      where: { id: searchParams.editPostId, orgId: user.orgId, status: "rejected" },
      include: {
        variants: { include: { xAccount: { select: { id: true, handle: true, name: true, verified: true } } } },
      },
    });
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={editPost ? "投稿修正・再申請" : "投稿作成"}
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <ComposeForm accounts={accounts} campaigns={campaigns} editPost={editPost} />
      </div>
    </div>
  );
}
