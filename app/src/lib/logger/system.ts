import { prisma } from "@/lib/db/client";

export type SystemLogLevel = "info" | "warn" | "error";

export interface SystemLogParams {
  level: SystemLogLevel;
  source: string;
  message: string;
  detail?: string;
  stack?: string;
  postId?: string;
  accountId?: string;
  userId?: string;
  orgId?: string;
}

export async function writeSystemLog(params: SystemLogParams): Promise<void> {
  try {
    await prisma.systemLog.create({ data: params });
  } catch (err) {
    // ログ書き込み自体が失敗しても呼び出し元に影響させない
    console.error("[SystemLog] 書き込み失敗:", err);
  }
}

/** Error オブジェクトを SystemLog に変換するヘルパー */
export function errorToLog(
  err: unknown,
  params: Omit<SystemLogParams, "level" | "message" | "stack">
): SystemLogParams {
  if (err instanceof Error) {
    return {
      level: "error",
      message: err.message,
      stack: err.stack,
      ...params,
    };
  }
  return {
    level: "error",
    message: String(err),
    ...params,
  };
}
