import { prisma } from "@/lib/db/client";
import { decrypt, encrypt } from "@/lib/crypto/token";

interface TokenResult {
  accessToken: string;
}

/**
 * DBのアカウントから有効なアクセストークンを返す。
 * 期限切れの場合はリフレッシュトークンで自動更新してDBに保存する。
 */
export async function getAccessToken(xAccountId: string): Promise<TokenResult> {
  const account = await prisma.xAccount.findUnique({
    where: { id: xAccountId },
  });

  if (!account) {
    throw new Error("アカウントが見つかりません");
  }

  // 期限に余裕を持たせて（5分前）チェック
  const isExpired = new Date(account.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000);

  if (!isExpired) {
    return { accessToken: decrypt(account.tokenEncrypted) };
  }

  // リフレッシュトークンがなければ再接続を促す
  if (!account.refreshTokenEncrypted) {
    throw new Error("トークンが期限切れです。アカウントを再接続してください");
  }

  const refreshToken = decrypt(account.refreshTokenEncrypted);

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // リフレッシュ失敗時はDBステータスを token_expired に更新
    await prisma.xAccount.update({
      where: { id: xAccountId },
      data: { status: "token_expired" },
    });
    throw new Error(`トークンのリフレッシュに失敗しました (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const newTokenEncrypted = encrypt(json.access_token);
  const newRefreshTokenEncrypted = json.refresh_token
    ? encrypt(json.refresh_token)
    : account.refreshTokenEncrypted;
  const newExpiresAt = new Date(Date.now() + (json.expires_in ?? 7200) * 1000);

  await prisma.xAccount.update({
    where: { id: xAccountId },
    data: {
      tokenEncrypted: newTokenEncrypted,
      refreshTokenEncrypted: newRefreshTokenEncrypted,
      tokenExpiresAt: newExpiresAt,
    },
  });

  return { accessToken: json.access_token };
}
