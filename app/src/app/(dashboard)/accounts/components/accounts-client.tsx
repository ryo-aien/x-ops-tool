"use client";

import { useState } from "react";
import { AccountCard } from "./account-card";
import { XProfilePreview } from "./x-profile-preview";

interface Account {
  id: string;
  handle: string;
  name: string;
  avatarUrl?: string | null;
  verified: boolean;
  category?: string | null;
  status: string;
  tokenExpiresAt: Date;
  followersCount: number;
  followingCount: number;
  lastPostAt?: Date | null;
  bio?: string | null;
  unreadCount: number;
  followersHistory: { date: Date; followers: number }[];
}

interface AccountsClientProps {
  accounts: Account[];
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    accounts.length > 0 ? accounts[0].id : null
  );

  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>アカウントがまだ接続されていません</p>
        <p className="text-sm mt-1">「アカウントを追加」からXアカウントを接続してください</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 min-h-0">
      {/* 左: アカウント一覧（縦並び） */}
      <div className="flex flex-col gap-3 w-80 flex-shrink-0 overflow-y-auto">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => setSelectedId(account.id)}
            className="cursor-pointer"
          >
            <AccountCard
              account={account}
              selected={account.id === selectedId}
            />
          </div>
        ))}
      </div>

      {/* 右: Xプロフィールプレビュー */}
      <div className="flex-1 min-w-0">
        {selectedAccount && <XProfilePreview account={selectedAccount} />}
      </div>
    </div>
  );
}
