import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { ListeningDashboard } from "./components/listening-dashboard";

export default async function ListeningPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const keywords = await prisma.listeningKeyword.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { mentions: true } },
      mentions: {
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="ソーシャルリスニング"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <ListeningDashboard keywords={keywords} orgId={user.orgId || ""} />
      </div>
    </div>
  );
}
