import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { encrypt } from "@/lib/crypto/token";
import { writeAuditLog } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const user = session.user as { id: string; orgId?: string };

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const clearCookies = (res: NextResponse) => {
    res.cookies.delete("x_oauth_state");
    res.cookies.delete("x_oauth_code_verifier");
    return res;
  };

  if (error) {
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=oauth_denied`)
    );
  }

  if (!code || !state) {
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=oauth_invalid`)
    );
  }

  const storedState = req.cookies.get("x_oauth_state")?.value;
  const codeVerifier = req.cookies.get("x_oauth_code_verifier")?.value;

  if (!storedState || state !== storedState || !codeVerifier) {
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=oauth_state_mismatch`)
    );
  }

  // アクセストークン取得
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${baseUrl}/api/auth/x/callback`,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=token_exchange_failed`)
    );
  }

  const tokenJson = await tokenRes.json();
  console.log("token response keys:", Object.keys(tokenJson));
  const { access_token, refresh_token, expires_in } = tokenJson;

  // X ユーザー情報取得
  const userRes = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const userBody = await userRes.text();
  console.error("X users/me status:", userRes.status, userBody);

  if (!userRes.ok) {
    const status = encodeURIComponent(userRes.status);
    const detail = encodeURIComponent(userBody.slice(0, 200));
    return clearCookies(
      NextResponse.redirect(
        `${baseUrl}/accounts?error=user_fetch_failed&xstatus=${status}&xdetail=${detail}`
      )
    );
  }

  const userJson = JSON.parse(userBody);
  const xUser = userJson.data;

  // トークン暗号化
  const tokenEncrypted = encrypt(access_token);
  const refreshTokenEncrypted = refresh_token ? encrypt(refresh_token) : null;
  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 7200) * 1000);

  // orgId チェック
  if (!user.orgId) {
    console.error("X callback: user.orgId is missing", { userId: user.id });
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=no_org`)
    );
  }

  // DB に保存（既存アカウントはトークン更新）
  let account;
  try {
    account = await prisma.xAccount.upsert({
      where: { xUserId: xUser.id },
      create: {
        orgId: user.orgId,
        xUserId: xUser.id,
        handle: xUser.username,
        name: xUser.name,
        avatarUrl: xUser.profile_image_url ?? null,
        verified: false,
        tokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      },
      update: {
        handle: xUser.username,
        name: xUser.name,
        avatarUrl: xUser.profile_image_url ?? null,
        tokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        status: "active",
      },
    });
  } catch (err) {
    console.error("X callback: DB upsert failed", err);
    return clearCookies(
      NextResponse.redirect(`${baseUrl}/accounts?error=db_save_failed`)
    );
  }

  await writeAuditLog({
    orgId: user.orgId!,
    userId: user.id,
    action: "account.connect",
    targetType: "x_account",
    targetId: account.id,
    detail: `アカウント @${account.handle} を接続`,
  });

  return clearCookies(
    NextResponse.redirect(`${baseUrl}/accounts?success=connected`)
  );
}
