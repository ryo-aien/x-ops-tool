import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { AccountCard } from "./components/account-card";
import { AccountSummary } from "./components/account-summary";

export default async function AccountsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const accounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: {
        select: { inboxItems: { where: { status: "unread" } } },
      },
      analyticsSnapshots: {
        orderBy: { date: "desc" },
        take: 7,
        select: { date: true, followers: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalFollowers = accounts.reduce((sum, a) => sum + a.followersCount, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  const totalUnread = accounts.reduce((sum, a) => sum + a._count.inboxItems, 0);
  const tokenExpired = accounts.filter(
    (a) => new Date(a.tokenExpiresAt) < new Date()
  ).length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="アカウント管理"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 space-y-6 overflow-auto">
        <AccountSummary
          totalFollowers={totalFollowers}
          activeCount={activeCount}
          totalUnread={totalUnread}
          tokenExpired={tokenExpired}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={{
                ...account,
                unreadCount: account._count.inboxItems,
                followersHistory: account.analyticsSnapshots,
              }}
            />
          ))}
          {accounts.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <p>アカウントがまだ接続されていません</p>
              <p className="text-sm mt-1">「アカウントを追加」からXアカウントを接続してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
