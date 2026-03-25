import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const guardrail = await prisma.guardrail.update({
    where: { id: params.id, orgId: user.orgId },
    data: {
      enabled: body.enabled,
      name: body.name,
      configJson: body.configJson,
    },
  });

  return NextResponse.json(guardrail);
}
