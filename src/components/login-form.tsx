"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setMessage("이메일로 로그인 링크를 보냈습니다. 받은 편지함을 확인하세요.");
  }

  async function signInGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={signInGoogle}
        className="w-full rounded-2xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-800"
      >
        Google로 계속하기
      </button>

      <div className="relative text-center text-xs text-stone-400">
        <span className="bg-white px-2">또는 이메일 매직링크</span>
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "전송 중..." : "로그인 링크 보내기"}
        </button>
      </form>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
