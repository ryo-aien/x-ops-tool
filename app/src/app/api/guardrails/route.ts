import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string };

  const guardrails = await prisma.guardrail.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(guardrails);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const guardrail = await prisma.guardrail.create({
    data: {
      orgId: user.orgId!,
      name: body.name,
      type: body.type,
      configJson: body.configJson || {},
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(guardrail, { status: 201 });
}
