import { prisma } from "@/lib/db/client";

interface AuditLogParams {
  orgId: string;
  userId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detail: params.detail,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("監査ログ書き込みエラー:", error);
  }
}
