import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AuditTable } from "./components/audit-table";

export default async function AuditPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string; role?: string };

  if (user.role !== "admin") {
    redirect("/accounts");
  }

  const logs = await prisma.auditLog.findMany({
    where: { orgId: user.orgId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    detail: log.detail,
    createdAt: formatDate(log.createdAt),
    user: log.user,
  }));

  return (
    <div className="flex flex-col h-full">
      <Header
        title="監査ログ"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <AuditTable logs={serialized} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
