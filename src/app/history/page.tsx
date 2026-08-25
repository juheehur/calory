import Link from "next/link";
import { ResultCard } from "@/components/result-card";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { MealItem, MealRow } from "@/lib/types";

export default async function HistoryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-stone-500">
        Supabase가 설정되지 않았습니다.{" "}
        <Link href="/login" className="underline">
          로그인
        </Link>
      </p>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center">
        <p className="font-medium">기록을 보려면 로그인하세요.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-2xl bg-stone-900 px-4 py-2 text-sm text-white"
        >
          로그인
        </Link>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: false })
    .limit(50);

  if (error) {
    return <p className="text-sm text-red-600">기록을 불러오지 못했습니다.</p>;
  }

  const meals = (data ?? []) as MealRow[];
  const groups = groupByDate(meals);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">식사 기록</h1>
        <p className="mt-1 text-sm text-stone-500">최근 분석이 날짜별로 정리됩니다.</p>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-stone-500">아직 저장된 식사가 없습니다. 사진을 올려 보세요.</p>
      )}

      {groups.map((group) => (
        <section key={group.date} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-stone-700">{group.date}</h2>
            <p className="text-sm text-stone-500">{group.total.toLocaleString()} kcal</p>
          </div>
          {group.meals.map((meal) => (
            <HistoryMeal key={meal.id} meal={meal} />
          ))}
        </section>
      ))}
    </div>
  );
}

async function HistoryMeal({ meal }: { meal: MealRow }) {
  const supabase = await createClient();
  let imageUrl: string | null = null;
  if (meal.image_path) {
    const { data } = await supabase.storage
      .from("meal-photos")
      .createSignedUrl(meal.image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }

  const items = (meal.items ?? []) as MealItem[];
  const time = new Date(meal.eaten_at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-3">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-40 w-full rounded-2xl object-cover" />
      )}
      <p className="text-xs text-stone-400">{time}</p>
      <ResultCard
        result={{
          totalKcal: Number(meal.total_kcal),
          macros: {
            proteinG: Number(meal.protein_g),
            carbG: Number(meal.carb_g),
            fatG: Number(meal.fat_g),
          },
          items,
          summary: meal.ai_summary ?? "",
          disclaimer: "",
          saved: true,
          mealId: meal.id,
        }}
      />
    </div>
  );
}

function groupByDate(meals: MealRow[]) {
  const map = new Map<string, { date: string; total: number; meals: MealRow[] }>();
  for (const meal of meals) {
    const date = new Date(meal.eaten_at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    const current = map.get(date) ?? { date, total: 0, meals: [] };
    current.total += Number(meal.total_kcal);
    current.meals.push(meal);
    map.set(date, current);
  }
  return Array.from(map.values());
}
