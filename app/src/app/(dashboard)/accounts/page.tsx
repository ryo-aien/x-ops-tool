import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { AccountSummary } from "./components/account-summary";
import { AddAccountButton } from "./components/add-account-button";
import { AccountsClient } from "./components/accounts-client";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "X認証がキャンセルされました",
  oauth_invalid: "無効なOAuthリクエストです",
  oauth_state_mismatch: "セキュリティエラーが発生しました。再度お試しください",
  token_exchange_failed: "トークン取得に失敗しました。再度お試しください",
  user_fetch_failed: "Xユーザー情報の取得に失敗しました",
  no_org: "組織情報が見つかりません。再度ログインしてください",
  db_save_failed: "データベースへの保存に失敗しました。再度お試しください",
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
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
        <AccountsClient
          accounts={accounts.map((account) => ({
            ...account,
            unreadCount: account._count.inboxItems,
            followersHistory: account.analyticsSnapshots,
          }))}
        />
      </div>
    </div>
  );
}
