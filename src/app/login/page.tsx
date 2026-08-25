import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const { error } = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-1 text-sm text-stone-500">
          로그인하면 식사 기록이 계정에 저장됩니다. 비회원도 사진 분석은 가능합니다.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">로그인에 실패했습니다. 다시 시도하세요.</p>}
      {isSupabaseConfigured() ? (
        <LoginForm />
      ) : (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Supabase 환경 변수가 없어 로그인을 켤 수 없습니다. README를 참고해 `.env.local`을
          설정하세요.
        </p>
      )}
    </div>
  );
}
