import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  const editorPasswordHash = await bcrypt.hash("editor1234", 10);

  // 組織の作成
  const org = await prisma.organization.upsert({
    where: { id: "org-demo-001" },
    update: {},
    create: {
      id: "org-demo-001",
      name: "デモ株式会社",
      plan: "pro",
    },
  });

  // 管理者ユーザーの作成
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      id: "user-admin-001",
      orgId: org.id,
      email: "admin@demo.com",
      name: "田中 管理者",
      role: "admin",
      passwordHash: adminPasswordHash,
    },
  });

  // 投稿者ユーザーの作成
  const editor = await prisma.user.upsert({
    where: { email: "editor@demo.com" },
    update: {},
    create: {
      id: "user-editor-001",
      orgId: org.id,
      email: "editor@demo.com",
      name: "鈴木 投稿者",
      role: "editor",
      passwordHash: editorPasswordHash,
    },
  });

  // Xアカウントの作成（デモ用）
  const account1 = await prisma.xAccount.upsert({
    where: { xUserId: "x-user-001" },
    update: {},
    create: {
      id: "x-account-001",
      orgId: org.id,
      xUserId: "x-user-001",
      handle: "demo_brand_a",
      name: "ブランドA公式",
      verified: true,
      category: "ブランド",
      status: "active",
      tokenEncrypted: "demo_encrypted_token_1",
      tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      followersCount: 12500,
      followingCount: 300,
      postsCount: 1250,
    },
  });

  const account2 = await prisma.xAccount.upsert({
    where: { xUserId: "x-user-002" },
    update: {},
    create: {
      id: "x-account-002",
      orgId: org.id,
      xUserId: "x-user-002",
      handle: "demo_brand_b",
      name: "ブランドB公式",
      verified: false,
      category: "EC",
      status: "active",
      tokenEncrypted: "demo_encrypted_token_2",
      tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      followersCount: 8200,
      followingCount: 150,
      postsCount: 850,
    },
  });

  // ユーザー権限設定
  await prisma.userAccountPermission.upsert({
    where: { userId_xAccountId: { userId: admin.id, xAccountId: account1.id } },
    update: {},
    create: { userId: admin.id, xAccountId: account1.id, role: "admin" },
  });

  await prisma.userAccountPermission.upsert({
    where: { userId_xAccountId: { userId: admin.id, xAccountId: account2.id } },
    update: {},
    create: { userId: admin.id, xAccountId: account2.id, role: "admin" },
  });

  await prisma.userAccountPermission.upsert({
    where: { userId_xAccountId: { userId: editor.id, xAccountId: account1.id } },
    update: {},
    create: { userId: editor.id, xAccountId: account1.id, role: "editor" },
  });

  // サンプル投稿
  const post1 = await prisma.post.upsert({
    where: { id: "post-001" },
    update: {},
    create: {
      id: "post-001",
      orgId: org.id,
      status: "published",
      authorId: editor.id,
      approverId: admin.id,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.postVariant.upsert({
    where: { postId_xAccountId: { postId: post1.id, xAccountId: account1.id } },
    update: {},
    create: {
      postId: post1.id,
      xAccountId: account1.id,
      text: "新商品のご案内！春の新コレクションが登場しました🌸 詳細はプロフィールのリンクをチェック！ #春コレクション #新商品",
      mediaUrls: [],
    },
  });

  const post2 = await prisma.post.upsert({
    where: { id: "post-002" },
    update: {},
    create: {
      id: "post-002",
      orgId: org.id,
      status: "pending",
      authorId: editor.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.postVariant.upsert({
    where: { postId_xAccountId: { postId: post2.id, xAccountId: account1.id } },
    update: {},
    create: {
      postId: post2.id,
      xAccountId: account1.id,
      text: "明日開催！春セール期間中は全品20%オフ。お見逃しなく！ #セール #割引",
    },
  });

  // 受信箱サンプル
  await prisma.inboxItem.createMany({
    data: [
      {
        id: "inbox-001",
        xAccountId: account1.id,
        type: "mention",
        fromHandle: "user_tanaka",
        text: "@demo_brand_a 新商品気になります！いつ発売ですか？",
        status: "unread",
        priority: "normal",
        receivedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: "inbox-002",
        xAccountId: account1.id,
        type: "reply",
        fromHandle: "angry_user",
        text: "@demo_brand_a 対応が遅すぎる！クレームです！",
        status: "unread",
        priority: "urgent",
        receivedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      // demo_brand_b の未読サンプル
      {
        id: "inbox-003",
        xAccountId: account2.id,
        type: "mention",
        fromHandle: "shopper_yamada",
        text: "@demo_brand_b 注文した商品がまだ届いていないのですが、確認できますか？",
        status: "unread",
        priority: "high",
        receivedAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: "inbox-004",
        xAccountId: account2.id,
        type: "reply",
        fromHandle: "ec_fan_sato",
        text: "@demo_brand_b 先日購入したアイテム、最高でした！次のセールも楽しみにしています😊",
        status: "unread",
        priority: "normal",
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "inbox-005",
        xAccountId: account2.id,
        type: "dm",
        fromHandle: "wholesale_inquiry",
        text: "卸売りの取引について相談させていただきたいのですが、担当者様へつないでいただけますか？",
        status: "unread",
        priority: "high",
        receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: "inbox-006",
        xAccountId: account2.id,
        type: "quote",
        fromHandle: "influencer_kato",
        text: "@demo_brand_b のこの商品、マジで使える。コスパ最強。みんなにおすすめしたい！",
        status: "unread",
        priority: "normal",
        receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // 分析スナップショット（過去7日分）
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    await prisma.analyticsSnapshot.upsert({
      where: { xAccountId_date: { xAccountId: account1.id, date } },
      update: {},
      create: {
        xAccountId: account1.id,
        date,
        impressions: BigInt(Math.floor(Math.random() * 5000) + 2000),
        engagements: Math.floor(Math.random() * 300) + 100,
        likes: Math.floor(Math.random() * 200) + 50,
        retweets: Math.floor(Math.random() * 50) + 10,
        replies: Math.floor(Math.random() * 30) + 5,
        clicks: Math.floor(Math.random() * 100) + 20,
        followers: 12500 - i * Math.floor(Math.random() * 20),
        following: 300,
      },
    });

    await prisma.analyticsSnapshot.upsert({
      where: { xAccountId_date: { xAccountId: account2.id, date } },
      update: {},
      create: {
        xAccountId: account2.id,
        date,
        impressions: BigInt(Math.floor(Math.random() * 3000) + 1000),
        engagements: Math.floor(Math.random() * 200) + 50,
        likes: Math.floor(Math.random() * 150) + 30,
        retweets: Math.floor(Math.random() * 30) + 5,
        replies: Math.floor(Math.random() * 20) + 3,
        clicks: Math.floor(Math.random() * 60) + 10,
        followers: 8200 - i * Math.floor(Math.random() * 15),
        following: 150,
      },
    });
  }

  // ガードレール設定
  await prisma.guardrail.createMany({
    data: [
      {
        id: "guardrail-001",
        orgId: org.id,
        name: "NGワードフィルタ",
        type: "content",
        configJson: { keywords: ["不適切語", "禁止ワード"] },
        enabled: true,
      },
      {
        id: "guardrail-002",
        orgId: org.id,
        name: "画像サイズチェック",
        type: "media",
        configJson: { minWidth: 600, minHeight: 335, maxSizeMB: 5 },
        enabled: true,
      },
      {
        id: "guardrail-003",
        orgId: org.id,
        name: "深夜投稿禁止",
        type: "schedule",
        configJson: { startHour: 23, endHour: 6 },
        enabled: true,
      },
      {
        id: "guardrail-004",
        orgId: org.id,
        name: "UTM自動付与",
        type: "link",
        configJson: { utmSource: "x", utmMedium: "social" },
        enabled: false,
      },
    ],
    skipDuplicates: true,
  });

  // リスニングキーワード
  await prisma.listeningKeyword.createMany({
    data: [
      {
        id: "keyword-001",
        orgId: org.id,
        keyword: "ブランドA",
        type: "brand",
        alertThreshold: 50,
        enabled: true,
      },
      {
        id: "keyword-002",
        orgId: org.id,
        keyword: "#春コレクション",
        type: "hashtag",
        alertThreshold: 100,
        enabled: true,
      },
      {
        id: "keyword-003",
        orgId: org.id,
        keyword: "競合ブランド",
        type: "competitor",
        alertThreshold: 30,
        enabled: true,
      },
    ],
    skipDuplicates: true,
  });

  // キャンペーン
  await prisma.campaign.upsert({
    where: { id: "campaign-001" },
    update: {},
    create: {
      id: "campaign-001",
      orgId: org.id,
      name: "2026春キャンペーン",
      status: "active",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
      budget: 500000,
    },
  });

  console.log("✅ シードデータ投入完了");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
