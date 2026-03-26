import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { InboxList } from "./components/inbox-list";

interface InboxPageProps {
  searchParams: Promise<{ accountId?: string; status?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };
  const { accountId, status } = await searchParams;

  const orgAccounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    select: { id: true },
  });
  const orgAccountIds = orgAccounts.map((a) => a.id);

  // accountIdが指定されている場合はそのアカウントのみ、なければ全アカウント
  const accountIds =
    accountId && orgAccountIds.includes(accountId)
      ? [accountId]
      : orgAccountIds;

  const [items, summary] = await Promise.all([
    prisma.inboxItem.findMany({
      where: { xAccountId: { in: accountIds } },
      include: {
        xAccount: { select: { handle: true, name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ priority: "asc" }, { receivedAt: "desc" }],
      take: 50,
    }),
    prisma.inboxItem.groupBy({
      by: ["status"],
      where: { xAccountId: { in: accountIds } },
      _count: { id: true },
    }),
  ]);

  const teamMembers = await prisma.user.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true },
  });

  const summaryMap = Object.fromEntries(
    summary.map((s) => [s.status, s._count.id])
  );

  // アカウント名を取得（フィルタ中の表示用）
  const filteredAccount = accountId
    ? await prisma.xAccount.findUnique({
        where: { id: accountId },
        select: { handle: true, name: true },
      })
    : null;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="統合受信箱"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <InboxList
          items={items}
          summaryMap={summaryMap}
          teamMembers={teamMembers}
          initialTab={status === "unread" ? "unread" : undefined}
          filteredAccount={filteredAccount ?? undefined}
        />
      </div>
    </div>
  );
}
