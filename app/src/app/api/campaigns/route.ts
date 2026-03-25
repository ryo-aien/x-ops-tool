import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string };

  const campaigns = await prisma.campaign.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { posts: true } },
      campaignAccounts: {
        include: { xAccount: { select: { handle: true, name: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string; role?: string };
  if (!["admin", "approver", "editor"].includes(user.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const campaign = await prisma.campaign.create({
    data: {
      orgId: user.orgId!,
      name: body.name,
      status: body.status || "planned",
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      budget: body.budget || 0,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
