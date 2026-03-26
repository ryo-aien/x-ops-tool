# X API セットアップ手順書

## 概要

このアプリでXアカウントを管理するには、以下の2段階の設定が必要です。

1. **X Developer App の作成** → `X_CLIENT_ID` / `X_CLIENT_SECRET` を取得
2. **各Xアカウントの OAuth 認証** → アカウントごとのアクセストークンを取得

---

## STEP 1: X Developer App の作成（アプリ管理者が1回だけ行う）

### 1-1. Developer Portal にアクセス

https://developer.twitter.com/en/portal/dashboard

X（Twitter）アカウントでログインします。

### 1-2. アプリを作成

1. 左メニューの **「Projects & Apps」** → **「Overview」** を開く
2. **「+ Create App」** をクリック
3. アプリ名を入力（例: `x-multi-manager`）して **「Complete」**

### 1-3. API キーを取得

アプリ作成後に表示される画面、または **「Keys and tokens」** タブで以下を確認・コピーします。

| 項目 | .env.local の変数名 |
|---|---|
| Client ID | `X_CLIENT_ID` |
| Client Secret | `X_CLIENT_SECRET` |

> **注意:** Client Secret は作成時にしか表示されません。必ずコピーして保管してください。

### 1-4. OAuth 2.0 の設定

1. アプリの **「Settings」** タブを開く
2. **「User authentication settings」** の **「Set up」** をクリック
3. 以下のように設定します：

| 項目 | 設定値 |
|---|---|
| OAuth 2.0 | **ON** |
| App type | **Web App** |
| Callback URI | `http://localhost:3000/api/auth/x/callback` |
| Website URL | `https://example.com`（開発中はダミーでOK） |

4. **「Scopes」** で以下を有効化：

| スコープ | 用途 |
|---|---|
| `tweet.read` | 投稿の読み取り |
| `tweet.write` | 投稿の作成・削除 |
| `users.read` | ユーザー情報の取得 |
| `offline.access` | リフレッシュトークンの取得（長期利用に必要） |

5. **「Save」** をクリック

### 1-5. .env.local に設定

```env
X_CLIENT_ID="取得した Client ID"
X_CLIENT_SECRET="取得した Client Secret"
```

---

## STEP 2: 各Xアカウントのアクセストークン取得（アカウント追加のたびに行う）

アカウントごとのアクセストークンは、アプリ上でOAuth認証を行うことで取得します。
**現在このフローは未実装のため、実装完了後に以下の手順で操作します。**

### 2-1. アカウント管理画面を開く

アプリにログイン後、左メニューの **「アカウント管理」** を開きます。

### 2-2. Xアカウントを追加

1. **「+ アカウントを追加」** ボタンをクリック
2. X の OAuth 認証画面にリダイレクトされます
3. 追加したいXアカウントでログインし、**「アプリを認証」** をクリック

### 2-3. 自動処理（実装後）

OAuth 認証が完了すると、以下が自動で行われます：

```
アクセストークン取得
  ↓
TOKEN_ENCRYPTION_KEY で AES-256-GCM 暗号化
  ↓
データベース（XAccount テーブル）に保存
  ↓
アカウント管理画面に表示
```

### 2-4. 複数アカウントの追加

STEP 2 を繰り返すことで、アカウント数に制限なく追加できます。
各アカウントのトークンは個別に暗号化されてDBに保存されます。

---

## トークンの有効期限について

| トークン種別 | 有効期限 | 対応 |
|---|---|---|
| アクセストークン | 2時間 | リフレッシュトークンで自動更新 |
| リフレッシュトークン | 6ヶ月（`offline.access` スコープ時） | 期限切れ時は再認証が必要 |

> `offline.access` スコープを有効にしておくと、リフレッシュトークンが発行され長期間の運用が可能になります。

---

## トラブルシューティング

### Callback URI が一致しないエラー

Developer Portal に登録した Callback URI とアプリの設定が一致しているか確認してください。

```
登録値: http://localhost:3000/api/auth/callback/twitter
```

本番環境では `localhost` をドメインに変更する必要があります。

### スコープ不足エラー

投稿作成や読み取りが失敗する場合、STEP 1-4 のスコープ設定を再確認してください。

### アクセストークンが期限切れ

アカウント管理画面から該当アカウントを一度削除し、STEP 2 を再実行してください。

---

## 関連ファイル

| ファイル | 内容 |
|---|---|
| `app/.env.example` | 環境変数のテンプレート |
| `app/src/lib/crypto/token.ts` | トークン暗号化・復号ロジック |
| `app/src/lib/auth/config.ts` | NextAuth 設定 |
| `app/src/app/api/accounts/route.ts` | アカウント管理 API |
