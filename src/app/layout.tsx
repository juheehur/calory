import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "한끼칼로리",
  description: "음식 사진으로 칼로리를 추정하고 기록을 남깁니다.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let email: string | null = null;
  let todayKcal: number | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;

    if (user) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("meals")
        .select("total_kcal")
        .eq("user_id", user.id)
        .gte("eaten_at", start.toISOString());
      todayKcal = (data ?? []).reduce(
        (sum, row) => sum + Number(row.total_kcal ?? 0),
        0,
      );
    }
  }

  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#fff8f1] text-stone-900 antialiased`}
      >
        <Header email={email} todayKcal={todayKcal} />
        <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
