CREATE TABLE "x_account_preview_caches" (
    "id" TEXT NOT NULL,
    "x_account_id" TEXT NOT NULL,
    "description" TEXT,
    "profile_image_url" TEXT,
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "tweet_count" INTEGER NOT NULL DEFAULT 0,
    "tweets_json" JSONB NOT NULL DEFAULT '[]',
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "x_account_preview_caches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "x_account_preview_caches_x_account_id_key" ON "x_account_preview_caches"("x_account_id");

ALTER TABLE "x_account_preview_caches" ADD CONSTRAINT "x_account_preview_caches_x_account_id_fkey" FOREIGN KEY ("x_account_id") REFERENCES "x_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
