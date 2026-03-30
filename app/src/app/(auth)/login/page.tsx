"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const XLogo = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
    } else {
      router.push("/accounts");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#000" }}
    >
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8" style={{ color: "#E7E9EA" }}>
          <XLogo />
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "#16181C",
            border: "1px solid #2F3336",
          }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-bold" style={{ color: "#E7E9EA" }}>
              X Multi-Account Manager
            </h1>
            <p className="text-sm mt-1" style={{ color: "#71767B" }}>
              アカウントにログイン
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#E7E9EA" }}
              >
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo.com"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "#000",
                  border: "1px solid #2F3336",
                  color: "#E7E9EA",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1D9BF0")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2F3336")}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#E7E9EA" }}
              >
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "#000",
                  border: "1px solid #2F3336",
                  color: "#E7E9EA",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1D9BF0")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2F3336")}
              />
            </div>

            <div
              className="text-xs p-3 rounded-xl"
              style={{
                background: "rgba(29,155,240,0.08)",
                border: "1px solid rgba(29,155,240,0.2)",
                color: "#71767B",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "#1D9BF0" }}>
                デモアカウント
              </p>
              <p>管理者: admin@demo.com / admin1234</p>
              <p>投稿者: editor@demo.com / editor1234</p>
            </div>

            {error && (
              <p
                className="text-sm px-3 py-2 rounded-xl"
                style={{
                  color: "#F4212E",
                  background: "rgba(244,33,46,0.08)",
                  border: "1px solid rgba(244,33,46,0.2)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full text-sm font-bold transition-colors"
              style={{
                background: loading ? "#1A8CD8" : "#1D9BF0",
                color: "#fff",
                border: "none",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = "#1A8CD8";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = "#1D9BF0";
              }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
