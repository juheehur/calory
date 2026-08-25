"use client";

import { useEffect, useState } from "react";
import { NutritionCard } from "@/components/nutrition-card";
import type { AnalyzeResult, NutritionAdvice } from "@/lib/types";

const STORAGE_KEY = "food-calorie:last-result";

export function NutritionPanel({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [advice, setAdvice] = useState<NutritionAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    let meal: AnalyzeResult | undefined;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) meal = JSON.parse(raw) as AnalyzeResult;
    } catch {
      meal = undefined;
    }

    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal && !isLoggedIn ? { meal } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "추천을 불러오지 못했습니다.");
        return;
      }
      setAdvice(data as NutritionAdvice);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">부족한 영양</h1>
        <p className="mt-1 text-sm text-stone-500">
          {isLoggedIn
            ? "오늘 저장된 식사를 기준으로 다음에 먹으면 좋은 음식을 추천합니다."
            : "방금 분석한 한 끼를 하루 권장량과 비교합니다. 로그인하면 오늘 전체 기록이 반영됩니다."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "분석 중..." : "다시 추천받기"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {advice && <NutritionCard advice={advice} />}
    </div>
  );
}
