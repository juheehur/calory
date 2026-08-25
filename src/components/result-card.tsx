import type { AnalyzeResult } from "@/lib/types";

export function ResultCard({ result }: { result: AnalyzeResult }) {
  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-stone-500">추정 총 칼로리</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-stone-900">
          {result.totalKcal.toLocaleString()}
          <span className="ml-1 text-lg font-medium text-stone-500">kcal</span>
        </p>
        {result.saved && (
          <p className="mt-2 text-xs font-medium text-emerald-700">기록에 저장되었습니다.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Macro label="탄수" value={result.macros.carbG} />
        <Macro label="단백질" value={result.macros.proteinG} />
        <Macro label="지방" value={result.macros.fatG} />
      </div>

      {result.summary && <p className="text-sm leading-relaxed text-stone-700">{result.summary}</p>}

      <ul className="divide-y divide-stone-100">
        {result.items.map((item) => (
          <li key={`${item.name}-${item.portionEstimate}`} className="flex items-start justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-stone-900">{item.name}</p>
              <p className="text-xs text-stone-500">
                {item.portionEstimate} · 신뢰도 {Math.round(item.confidence * 100)}%
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-stone-800">{item.kcal} kcal</p>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-stone-400">{result.disclaimer}</p>
    </section>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-2 py-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-stone-800">{value}g</p>
    </div>
  );
}
