"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddAccountButtonProps {
  successMessage?: string | null;
  errorMessage?: string | null;
}

export function AddAccountButton({
  successMessage,
  errorMessage,
}: AddAccountButtonProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {successMessage && (
        <span className="text-sm" style={{ color: "#00BA7C" }}>
          {successMessage}
        </span>
      )}
      {errorMessage && (
        <span className="text-sm" style={{ color: "#F4212E" }}>
          {errorMessage}
        </span>
      )}
      <button
        onClick={() => router.push("/api/auth/x/connect")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors"
        style={{ background: "#1D9BF0", color: "#fff" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#1A8CD8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#1D9BF0";
        }}
      >
        <Plus className="h-4 w-4" />
        アカウントを追加
      </button>
    </div>
  );
}
