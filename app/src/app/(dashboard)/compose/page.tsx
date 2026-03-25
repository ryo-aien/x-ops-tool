import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { ComposeForm } from "./components/compose-form";

export default async function ComposePage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const accounts = await prisma.xAccount.findMany({
    where: { orgId: user.orgId, status: "active" },
    select: { id: true, handle: true, name: true, verified: true },
    orderBy: { name: "asc" },
  });

  const campaigns = await prisma.campaign.findMany({
    where: { orgId: user.orgId, status: { in: ["planned", "active"] } },
    select: { id: true, name: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="投稿作成"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <ComposeForm accounts={accounts} campaigns={campaigns} />
      </div>
    </div>
  );
}
