import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SystemLogsClient } from "./components/system-logs-client";

export default async function SystemLogsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; role?: string; name?: string; email?: string };

  if (user.role !== "admin") {
    redirect("/accounts");
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="システムログ"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 flex flex-col gap-4 overflow-hidden h-full">
        <SystemLogsClient />
      </div>
    </div>
  );
}
