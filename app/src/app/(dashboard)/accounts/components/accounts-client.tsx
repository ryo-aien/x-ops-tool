"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function SortableAccountCard({
  account,
  selected,
  onClick,
}: {
  account: Account;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing"
    >
      <AccountCard account={account} selected={selected} />
    </div>
  );
}

export function AccountsClient({ accounts: initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAccounts.length > 0 ? initialAccounts[0].id : null
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;
  const draggingAccount = draggingId ? accounts.find((a) => a.id === draggingId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (over && active.id !== over.id) {
      setAccounts((prev) => {
        const oldIndex = prev.findIndex((a) => a.id === active.id);
        const newIndex = prev.findIndex((a) => a.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

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
      {/* 左: アカウント一覧（縦並び・ドラッグ&ドロップ） */}
      <div className="flex flex-col gap-3 w-80 flex-shrink-0 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={accounts.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {accounts.map((account) => (
              <SortableAccountCard
                key={account.id}
                account={account}
                selected={account.id === selectedId}
                onClick={() => setSelectedId(account.id)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {draggingAccount && (
              <div style={{ opacity: 0.9 }}>
                <AccountCard
                  account={draggingAccount}
                  selected={draggingAccount.id === selectedId}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* 右: Xプロフィールプレビュー */}
      <div className="flex-1 min-w-0">
        {selectedAccount && <XProfilePreview account={selectedAccount} />}
      </div>
    </div>
  );
}
