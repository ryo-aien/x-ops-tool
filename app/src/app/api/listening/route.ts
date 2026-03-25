import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; orgId?: string };

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const keywords = await prisma.listeningKeyword.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { mentions: true } },
      mentions: {
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(keywords);
}
