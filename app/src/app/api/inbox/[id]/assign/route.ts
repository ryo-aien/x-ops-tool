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
  const body = await req.json();

  const item = await prisma.inboxItem.update({
    where: { id: params.id },
    data: { assigneeId: body.assigneeId, status: "assigned" },
  });

  return NextResponse.json(item);
}
