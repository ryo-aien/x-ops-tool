import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getStatusLabel } from "@/lib/utils";

export default async function CampaignsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const campaigns = await prisma.campaign.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { posts: true } },
      campaignAccounts: {
        include: { xAccount: { select: { handle: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const statusColor: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
    planned: "secondary",
    active: "success",
    completed: "outline",
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="キャンペーン管理"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const now = new Date();
            const start = new Date(campaign.startDate);
            const end = new Date(campaign.endDate);
            const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const daysElapsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const progress = Math.min(100, Math.round((daysElapsed / daysTotal) * 100));

            return (
              <Card key={campaign.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 text-sm">{campaign.name}</h3>
                    <Badge variant={statusColor[campaign.status] || "secondary"}>
                      {getStatusLabel(campaign.status)}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>{formatDate(campaign.startDate)} 〜 {formatDate(campaign.endDate)}</p>
                    <p>投稿数: {campaign._count.posts}件</p>
                    {campaign.budget > 0 && (
                      <p>予算: ¥{campaign.budget.toLocaleString()}</p>
                    )}
                  </div>

                  {campaign.campaignAccounts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {campaign.campaignAccounts.map((ca) => (
                        <Badge key={ca.xAccountId} variant="outline" className="text-xs">
                          @{ca.xAccount.handle}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {campaign.status === "active" && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>期間進捗</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {campaigns.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              キャンペーンがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
