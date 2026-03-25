import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabel } from "@/lib/utils";

export default async function TeamPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string; role?: string };

  if (user.role !== "admin") {
    redirect("/accounts");
  }

  const members = await prisma.user.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "asc" },
  });

  const roleColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    approver: "bg-orange-100 text-orange-700",
    editor: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="チームメンバー管理"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  <div className="mt-1">
                    <Badge
                      className={`text-xs ${roleColor[member.role] || ""}`}
                      variant="outline"
                    >
                      {getRoleLabel(member.role)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
