import type { NutritionAdvice } from "@/lib/types";

export function NutritionCard({ advice }: { advice: NutritionAdvice }) {
  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-stone-500">{advice.periodLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-800">{advice.summary}</p>
      </div>
      <ul className="space-y-2">
        {advice.gaps.map((gap) => (
          <li key={gap.nutrient} className="rounded-2xl bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-stone-900">{gap.nutrient}</p>
              <span className={`text-xs font-semibold ${statusColor(gap.status)}`}>
                {statusLabel(gap.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {gap.current}
              {gap.unit} / 목표 {gap.target}
              {gap.unit}
            </p>
            <p className="mt-1 text-sm text-stone-700">{gap.advice}</p>
          </li>
        ))}
      </ul>
      <div>
        <p className="text-sm font-medium text-stone-800">다음에 먹으면 좋은 음식</p>
        <ul className="mt-2 space-y-2">
          {advice.nextFoods.map((food) => (
            <li key={food.name} className="text-sm text-stone-700">
              <span className="font-medium text-stone-900">{food.name}</span>
              <span className="text-stone-500"> — {food.reason}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs leading-relaxed text-stone-400">{advice.disclaimer}</p>
    </section>
  );
}

function statusLabel(status: "low" | "ok" | "high") {
  if (status === "low") return "부족";
  if (status === "high") return "과다";
  return "적정";
}

function statusColor(status: "low" | "ok" | "high") {
  if (status === "low") return "text-orange-700";
  if (status === "high") return "text-red-700";
  return "text-emerald-700";
}
