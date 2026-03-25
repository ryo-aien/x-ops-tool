import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

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

  const actionColor: Record<string, string> = {
    "post.create": "bg-blue-100 text-blue-700",
    "post.approve": "bg-green-100 text-green-700",
    "post.reject": "bg-red-100 text-red-700",
    "post.delete": "bg-red-100 text-red-700",
    "account.connect": "bg-purple-100 text-purple-700",
    "account.disconnect": "bg-orange-100 text-orange-700",
  };

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
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">日時</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ユーザー</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">操作</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">対象</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-700">
                        {log.user?.name || "システム"}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          className={`text-xs ${actionColor[log.action] || "bg-gray-100 text-gray-700"}`}
                          variant="outline"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{log.targetType}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-600">{log.detail}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        ログがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
