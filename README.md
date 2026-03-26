# X Multi-Account Manager

複数のX（旧Twitter）アカウントを一元管理するダッシュボードアプリケーション。投稿管理・承認ワークフロー・分析・カスタマーサポート・リスク管理を包括的にカバーします。

## 機能一覧

| # | 機能 | 説明 |
|---|---|---|
| F1 | アカウント管理 | 複数Xアカウントの接続・一覧・ステータス管理 |
| F2 | 投稿作成 | 複数アカウント同時配信・予約投稿・ガードレールチェック |
| F3 | 統合受信箱 | メンション・返信・DM の一元管理・担当者アサイン |
| F4 | 承認ワークフロー | 下書き → 承認待ち → 承認済み / 差し戻しのステート管理 |
| F5 | 分析ダッシュボード | インプレッション・エンゲージメント・フォロワー推移の可視化 |
| F6 | ソーシャルリスニング | キーワード監視・センチメント分析・炎上アラート |
| F7 | 権限管理・監査ログ | RBAC によるロール管理・全操作の監査ログ記録 |
| F8 | ガードレール | NGワード・深夜投稿禁止・UTM付与などの自動チェック |
| F9 | キャンペーン管理 | キャンペーン期間・予算・投稿の紐付け管理 |
| F10 | レポート出力 | 週次・月次・キャンペーン別レポートの PDF/CSV 生成 |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 3 |
| 状態管理 | Zustand + TanStack Query v5 |
| DB | PostgreSQL 16 (Docker) |
| ORM | Prisma 6 |
| 認証 | NextAuth.js v5 (Credentials) |
| チャート | Recharts |
| キャッシュ | Redis 7 (Docker) |

## ディレクトリ構成

```
/workspace
├── app/                        # Next.js アプリケーション
│   ├── prisma/
│   │   ├── schema.prisma       # DB スキーマ（13テーブル）
│   │   └── seed.ts             # デモ用シードデータ
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/   # ログインページ
│       │   ├── (dashboard)/    # 各機能ページ（F1〜F10 + チーム管理）
│       │   └── api/            # REST API エンドポイント
│       ├── components/
│       │   ├── ui/             # 基本UIコンポーネント
│       │   └── layout/         # サイドバー・ヘッダー
│       └── lib/
│           ├── auth/           # NextAuth 設定・RBAC
│           ├── crypto/         # AES-256-GCM トークン暗号化
│           ├── audit/          # 監査ログ書き込み
│           └── guardrails/     # ガードレールエンジン
├── docker/
│   ├── docker-compose.yml      # ローカル開発環境
│   └── Dockerfile              # マルチステージビルド
└── README.md
```

## ローカル起動手順

### 前提条件

- Docker / Docker Compose がインストール済みであること

### 起動

```bash
cd /workspace/docker
docker-compose up --build
```

初回起動前に、マイグレーションファイルを生成してください：

```bash
cd /workspace/docker
docker-compose up -d db
docker-compose exec app npx prisma migrate dev --name init
```

生成された `app/prisma/migrations/` を Git に commit します：

```bash
git add app/prisma/migrations/
git commit -m "add initial prisma migration"
```

その後、通常起動します：

```bash
docker-compose up --build
```

起動時に以下が自動実行されます：

1. PostgreSQL・Redis コンテナの起動
2. `prisma migrate deploy` でマイグレーション適用
3. `prisma db seed` でデモデータ投入
4. `npm run dev` で開発サーバー起動

ブラウザで http://localhost:3000 を開きます。

### デモアカウント

| メールアドレス | ロール | できること |
|---|---|---|
| admin@demo.com | 管理者 | 全操作・監査ログ閲覧・ガードレール設定 |
| editor@demo.com | 投稿者 | 投稿作成・受信箱対応 |

> パスワード入力欄は空欄のままログインできます（デモ用）。

## ロール権限

| 操作 | 管理者 | 承認者 | 投稿者 | 閲覧者 |
|---|:---:|:---:|:---:|:---:|
| 投稿作成・編集 | ✓ | ✓ | ✓ | - |
| 投稿承認・差し戻し | ✓ | ✓ | - | - |
| 受信箱アサイン | ✓ | ✓ | ✓ | - |
| アカウント追加・削除 | ✓ | - | - | - |
| ガードレール設定 | ✓ | - | - | - |
| 監査ログ閲覧 | ✓ | - | - | - |
| チームメンバー管理 | ✓ | - | - | - |
| 閲覧全般 | ✓ | ✓ | ✓ | ✓ |

## 環境変数

Docker Compose では自動設定されます。手動起動の場合は `app/.env.local` を作成してください。

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/xmanager"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-here-min-32-chars"
TOKEN_ENCRYPTION_KEY="64文字の16進数文字列（AES-256キー）"

# X API連携（実際のXアカウント接続時に必要）
X_CLIENT_ID="your-x-client-id"
X_CLIENT_SECRET="your-x-client-secret"
```

## 開発コマンド

```bash
cd /workspace/app

npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint チェック

npm run db:migrate   # マイグレーションファイル生成（スキーマ変更時）
npm run db:seed      # シードデータ投入
npm run db:studio    # Prisma Studio（DB GUI）起動
npm run db:generate  # Prisma クライアント再生成
```

## API エンドポイント一覧

| メソッド | パス | 説明 | 最低権限 |
|---|---|---|---|
| GET | `/api/accounts` | アカウント一覧 | 閲覧者 |
| POST | `/api/accounts` | アカウント追加 | 管理者 |
| PATCH | `/api/accounts/:id` | ステータス変更 | 管理者 |
| DELETE | `/api/accounts/:id` | アカウント削除 | 管理者 |
| GET | `/api/posts` | 投稿一覧 | 閲覧者 |
| POST | `/api/posts` | 投稿作成 | 投稿者 |
| PATCH | `/api/posts/:id` | 投稿編集 | 投稿者 |
| DELETE | `/api/posts/:id` | 投稿削除 | 投稿者 |
| PATCH | `/api/posts/:id/approve` | 投稿承認 | 承認者 |
| PATCH | `/api/posts/:id/reject` | 投稿差し戻し | 承認者 |
| GET | `/api/inbox` | 受信箱一覧 | 閲覧者 |
| PATCH | `/api/inbox/:id/assign` | 担当者アサイン | 投稿者 |
| PATCH | `/api/inbox/:id/done` | 対応完了 | 投稿者 |
| GET | `/api/analytics` | 分析データ | 閲覧者 |
| GET | `/api/guardrails` | ガードレール一覧 | 閲覧者 |
| PATCH | `/api/guardrails/:id` | ガードレール更新 | 管理者 |
| POST | `/api/guardrails` | ガードレール追加 | 管理者 |
| GET | `/api/listening` | リスニングデータ | 閲覧者 |
| POST | `/api/listening/keywords` | キーワード追加 | 投稿者 |
| DELETE | `/api/listening/keywords/:id` | キーワード削除 | 投稿者 |
| GET | `/api/campaigns` | キャンペーン一覧 | 閲覧者 |
| POST | `/api/campaigns` | キャンペーン作成 | 投稿者 |
| GET | `/api/audit-logs` | 監査ログ一覧 | 管理者 |
| GET | `/api/team` | チームメンバー一覧 | 管理者 |
| POST | `/api/team` | メンバー追加 | 管理者 |
