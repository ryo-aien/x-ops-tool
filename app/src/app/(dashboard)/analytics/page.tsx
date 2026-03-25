import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { AnalyticsDashboard } from "./components/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const accounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId },
    select: { id: true, handle: true, name: true },
  });

  const accountIds = accounts.map((a) => a.id);

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      xAccountId: { in: accountIds },
      date: { gte: sevenDaysAgo },
    },
    include: {
      xAccount: { select: { handle: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const result = snapshots.map((s) => ({
    ...s,
    impressions: Number(s.impressions),
  }));

  return (
    <div className="flex flex-col h-full">
      <Header
        title="分析ダッシュボード"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <AnalyticsDashboard accounts={accounts} snapshots={result} />
      </div>
    </div>
  );
}
