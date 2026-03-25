import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { InboxList } from "./components/inbox-list";

export default async function InboxPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const orgAccounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    select: { id: true },
  });
  const accountIds = orgAccounts.map((a) => a.id);

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
        />
      </div>
    </div>
  );
}
