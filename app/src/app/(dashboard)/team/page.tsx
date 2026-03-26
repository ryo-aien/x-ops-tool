import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TeamClient } from "./TeamClient";

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

  return (
    <div className="flex flex-col h-full">
      <Header
        title="チームメンバー管理"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <TeamClient
          initialMembers={members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role as "admin" | "approver" | "editor" | "viewer",
            createdAt: m.createdAt,
          }))}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
