import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Header } from "@/components/layout/header";
import { GuardrailList } from "./components/guardrail-list";

export default async function GuardrailsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string; role?: string };

  const guardrailsRaw = await prisma.guardrail.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "asc" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guardrails = guardrailsRaw as any[];

  const canEdit = user.role === "admin";

  return (
    <div className="flex flex-col h-full">
      <Header
        title="ブランド運用ガードレール"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <GuardrailList guardrails={guardrails} canEdit={canEdit} />
      </div>
    </div>
  );
}
