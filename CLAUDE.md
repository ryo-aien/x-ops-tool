# CLAUDE.md — X Multi-Account Manager プロジェクト概要

Claude Code がセッション開始時にこのファイルを読み込み、プロジェクト全体を把握するためのドキュメント。

---

## プロジェクト概要

**名称:** X Multi-Account Manager
**目的:** 複数の X（旧Twitter）アカウントを一元管理するエンタープライズ向けダッシュボード
**対象ユーザー:** マーケティング担当者・カスタマーサポート・ブランド責任者・代理店

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| 状態管理 | Zustand + TanStack Query |
| DB | PostgreSQL 16 + Prisma ORM |
| 認証 | NextAuth.js v5（Credentials + X OAuth 2.0 PKCE） |
| チャート | Recharts |
| D&D | @dnd-kit |
| 暗号化 | AES-256-GCM（X トークン保護） |

---

## ディレクトリ構造

```
/workspace
├── CLAUDE.md                   # このファイル
├── README.md
├── 01_製品仕様書.md             # 機能仕様の詳細
├── 02_技術設計書.md             # アーキテクチャ・データフロー
├── VERCEL_DEPLOY.md            # Vercel デプロイ手順
├── docker/
│   ├── docker-compose.yml      # ローカル開発環境（app + db + redis）
│   └── Dockerfile              # マルチステージビルド
└── app/                        # Next.js アプリ本体
    ├── prisma/
    │   ├── schema.prisma       # DB スキーマ（15 モデル）
    │   ├── seed.ts             # デモデータ投入
    │   └── migrations/         # マイグレーションファイル（要 git commit）
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/   # ログインページ
    │   │   ├── (dashboard)/    # 認証済みページ群
    │   │   └── api/            # REST API エンドポイント群
    │   ├── components/
    │   │   ├── ui/             # shadcn/ui ベースの基本コンポーネント
    │   │   ├── layout/         # ヘッダー・サイドバー
    │   │   └── shared/         # 共有コンポーネント
    │   ├── lib/
    │   │   ├── auth/           # NextAuth 設定・RBAC
    │   │   ├── crypto/         # AES-256-GCM トークン暗号化
    │   │   ├── db/             # Prisma クライアント
    │   │   ├── x/              # X API 連携（OAuth・クライアント・投稿発行）
    │   │   ├── guardrails/     # ガードレール実行エンジン
    │   │   ├── audit/          # 監査ログライター
    │   │   └── logger/         # システムログ
    │   ├── hooks/              # カスタム React フック
    │   ├── stores/             # Zustand ストア
    │   ├── types/              # TypeScript 型定義
    │   ├── middleware.ts        # 認証・ルーティング制御
    │   └── auth.ts             # NextAuth エクスポート
    ├── next.config.mjs         # Docker/Vercel 自動切替（DEPLOY_TARGET）
    ├── vercel.json             # Vercel ビルド設定
    └── package.json
```

---

## 画面一覧（ダッシュボード）

| ルート | 機能 |
|---|---|
| `/accounts` | F1: Xアカウント管理・接続・並び替え（D&D対応） |
| `/compose` | F2: 投稿作成・複数アカウント配信・予約投稿 |
| `/inbox` | F3: メンション・返信・DM 統合受信箱 |
| `/approval` | F4: 投稿承認ワークフロー・差し戻し |
| `/analytics` | F5: KPI・チャート・横断比較 |
| `/listening` | F6: キーワード監視・センチメント・アラート |
| `/guardrails` | F8: NG ワード・スケジュール・リンクルール設定 |
| `/campaigns` | F9: キャンペーン管理・予算・投稿紐付け |
| `/reports` | F10: 週次・月次・キャンペーン別レポート |
| `/team` | チームメンバー招待・ロール管理 |
| `/audit` | 全操作監査ログ・検索 |
| `/system-logs` | システムエラー・イベントログ（管理者） |

---

## API エンドポイント一覧

```
GET/POST        /api/accounts               アカウント一覧・追加
PATCH/DELETE    /api/accounts/[id]          アカウント更新・削除
PATCH           /api/accounts/reorder       並び順永続化
GET             /api/accounts/[id]/preview  プロフィールキャッシュ取得

GET/POST        /api/posts                  投稿一覧・作成
PATCH/DELETE    /api/posts/[id]             投稿編集・削除
POST            /api/posts/[id]/approve     承認
PATCH           /api/posts/[id]/reject      差し戻し
POST            /api/posts/publish          即時発行・予約実行

GET             /api/inbox                  受信箱一覧
PATCH           /api/inbox/[id]/assign      担当者アサイン
PATCH           /api/inbox/[id]/done        対応完了

GET             /api/analytics              分析データ

GET/POST        /api/guardrails             ガードレール一覧・作成
PATCH           /api/guardrails/[id]        ガードレール更新

GET/POST        /api/listening              リスニングデータ
GET/POST        /api/listening/keywords     キーワード管理
DELETE          /api/listening/keywords/[id]

GET/POST        /api/campaigns              キャンペーン管理
GET/POST/PATCH/DELETE /api/team             チームメンバー管理
GET             /api/audit-logs             監査ログ
GET             /api/reports                レポート生成
GET             /api/system-logs            システムログ

GET/POST        /api/auth/[...nextauth]     NextAuth ルートハンドラ
GET/POST        /api/auth/x/connect         X OAuth 接続開始
GET             /api/auth/x/callback        X OAuth コールバック
```

---

## DB スキーマ（主要モデル）

| モデル | テーブル | 説明 |
|---|---|---|
| Organization | organizations | テナント（マルチテナント対応） |
| User | users | ユーザー・ロール管理 |
| XAccount | x_accounts | 管理対象 X アカウント（トークン暗号化保存） |
| UserAccountPermission | user_account_permissions | ユーザー×アカウントの権限 |
| Post | posts | 投稿マスタ（ステータス管理） |
| PostVariant | post_variants | アカウント別投稿テキスト・メディア |
| InboxItem | inbox_items | メンション・返信・DM |
| AnalyticsSnapshot | analytics_snapshots | 日次分析スナップショット |
| ListeningKeyword | listening_keywords | 監視キーワード |
| ListeningMention | listening_mentions | キーワードヒット記録 |
| Guardrail | guardrails | 投稿チェックルール（JSON 設定） |
| Campaign | campaigns | キャンペーン管理 |
| AuditLog | audit_logs | 全操作監査ログ |
| SystemLog | system_logs | システムエラー・イベントログ |
| XAccountPreviewCache | x_account_preview_caches | X プロフィールキャッシュ |
| Account / Session / VerificationToken | — | NextAuth 管理テーブル |

**XAccount の重要フィールド:**
- `tokenEncrypted` / `refreshTokenEncrypted`: AES-256-GCM 暗号化済み X トークン
- `sortOrder`: アカウント管理画面の表示順（D&D で変更 → `/api/accounts/reorder` で永続化）
- `status`: `active` | `paused`

---

## 認証・権限

### ロール（4段階）

| ロール | 主な権限 |
|---|---|
| `admin` | 全操作・アカウント追加・ガードレール・チーム管理・監査ログ |
| `approver` | 投稿作成・承認・差し戻し・受信箱 |
| `editor` | 投稿作成・受信箱対応 |
| `viewer` | 閲覧のみ |

### デモアカウント（seed データ）

| メール | ロール |
|---|---|
| `admin@demo.com` | admin |
| `editor@demo.com` | editor |

> パスワード欄は空欄でログイン可能（デモ用）

---

## デプロイ構成

### ローカル開発（Docker Compose）

```bash
# 起動
docker compose -f docker/docker-compose.yml up --build

# マイグレーション（スキーマ変更後）
docker compose -f docker/docker-compose.yml exec app npx prisma migrate dev --name <変更名>
```

- **アプリ:** http://localhost:3000
- **構成:** app（Next.js）+ db（PostgreSQL 16）+ redis（Redis 7）
- コンテナ起動時に `prisma migrate deploy` + `prisma db seed` が自動実行

### 本番（Vercel）

- `vercel.json` の `buildCommand`: `prisma migrate deploy && prisma generate && next build`
- push するだけでマイグレーションが自動適用される
- DB: Neon / Supabase 推奨
- `DEPLOY_TARGET` 未設定で Next.js が自動最適化モードで動作

---

## 必要な環境変数

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続 URL |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | NextAuth セッション署名キー |
| `TOKEN_ENCRYPTION_KEY` | AES-256 キー（64 文字 16 進数） |
| `X_CLIENT_ID` | X Developer Portal のクライアント ID |
| `X_CLIENT_SECRET` | X Developer Portal のシークレット |
| `NEXTAUTH_URL` | アプリの公開 URL |
| `REDIS_URL` | Redis 接続 URL（任意） |
| `DEPLOY_TARGET` | `docker` を指定すると standalone モード有効 |

---

## 主要な開発コマンド

```bash
# ローカル（app/ ディレクトリで実行）
npm run dev           # 開発サーバー起動
npm run build         # プロダクションビルド
npm run lint          # ESLint

# Prisma
npm run db:migrate    # マイグレーションファイル生成（スキーマ変更時）
npm run db:seed       # デモデータ投入
npm run db:studio     # DB GUI 起動
npm run db:generate   # Prisma クライアント再生成
```

---

## スキーマ変更時の手順（重要）

1. `app/prisma/schema.prisma` を編集
2. マイグレーションファイルを生成:
   ```bash
   docker compose -f docker/docker-compose.yml exec app npx prisma migrate dev --name <変更名>
   ```
3. 生成されたファイルを git commit に含める（Vercel が `prisma migrate deploy` で自動適用）

---

## 参考ドキュメント

- `01_製品仕様書.md` — 機能要件・UI 仕様の詳細
- `02_技術設計書.md` — アーキテクチャ・データフロー・シーケンス図
- `VERCEL_DEPLOY.md` — Vercel デプロイの詳細手順
