"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email: string | null;
  todayKcal: number | null;
};

export function Header({ email, todayKcal }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fff8f1]/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight text-stone-900">
          한끼칼로리
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/nutrition" className="text-stone-600 hover:text-stone-900">
            영양
          </Link>
          <Link href="/selfie" className="text-stone-600 hover:text-stone-900">
            셀카
          </Link>
          {email ? (
            <>
              {todayKcal !== null && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-900">
                  오늘 {todayKcal.toLocaleString()} kcal
                </span>
              )}
              <Link href="/history" className="text-stone-600 hover:text-stone-900">
                기록
              </Link>
              <button type="button" onClick={signOut} className="text-stone-600 hover:text-stone-900">
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
