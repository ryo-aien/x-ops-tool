import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { AccountCard } from "./components/account-card";
import { AccountSummary } from "./components/account-summary";
import { AddAccountButton } from "./components/add-account-button";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "X認証がキャンセルされました",
  oauth_invalid: "無効なOAuthリクエストです",
  oauth_state_mismatch: "セキュリティエラーが発生しました。再度お試しください",
  token_exchange_failed: "トークン取得に失敗しました。再度お試しください",
  user_fetch_failed: "Xユーザー情報の取得に失敗しました",
};

interface AccountsPageProps {
  searchParams: Promise<{ success?: string; error?: string; xstatus?: string; xdetail?: string }>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; role?: string; name?: string; email?: string };
  const { success, error, xstatus, xdetail } = await searchParams;

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
  const expiredAccounts = accounts.filter(
    (a) => new Date(a.tokenExpiresAt) < new Date()
  );

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
          tokenExpired={expiredAccounts.length}
          expiredAccounts={expiredAccounts.map((a) => ({
            handle: a.handle,
            name: a.name,
            tokenExpiresAt: a.tokenExpiresAt.toISOString(),
          }))}
        />
        {user.role === "admin" && (
          <div className="flex justify-end">
            <AddAccountButton
              successMessage={success === "connected" ? "アカウントを接続しました" : null}
              errorMessage={
                error
                  ? `${ERROR_MESSAGES[error] ?? "エラーが発生しました"}${xstatus ? ` (HTTP ${xstatus})` : ""}${xdetail ? `: ${xdetail}` : ""}`
                  : null
              }
            />
          </div>
        )}
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
