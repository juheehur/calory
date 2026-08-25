"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeCard } from "@/components/recipe-card";
import { ResultCard } from "@/components/result-card";
import type { AnalyzeResult, Recipe } from "@/lib/types";

const STORAGE_KEY = "food-calorie:last-result";

export function AnalyzeForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as AnalyzeResult);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function onFile(next: File | null) {
    setFile(next);
    setError(null);
    setRecipe(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("사진을 먼저 선택하세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const body = new FormData();
    body.set("image", file);
    if (notes.trim()) body.set("notes", notes.trim());

    try {
      const response = await fetch("/api/analyze", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "분석에 실패했습니다.");
        return;
      }
      const next = data as AnalyzeResult;
      setResult(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (next.saved) router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function makeRecipe() {
    if (!file) {
      setError("레시피를 만들 음식 사진을 먼저 선택하세요.");
      return;
    }
    setRecipeLoading(true);
    setError(null);
    const body = new FormData();
    body.set("image", file);
    if (notes.trim()) body.set("notes", notes.trim());
    try {
      const response = await fetch("/api/recipe", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "레시피를 만들지 못했습니다.");
        return;
      }
      setRecipe(data as Recipe);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setRecipeLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-lg font-semibold text-stone-900">먹은 음식을 찍어 주세요</p>
          <p className="mt-1 text-sm text-stone-500">
            AI가 사진으로 칼로리와 탄단지를 추정합니다.
            {!isLoggedIn && " 로그인하면 기록이 저장됩니다."}
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="선택한 음식" className="max-h-56 w-full rounded-xl object-cover" />
          ) : (
            <>
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium text-orange-900">카메라 촬영 또는 앨범에서 선택</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모 (예: 반만 먹음, 소스 많음)"
          rows={2}
          className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-orange-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "분석 중..." : "칼로리 계산"}
        </button>
      </form>

      {result && (
        <>
          <ResultCard result={result} />
          <button
            type="button"
            onClick={() => void makeRecipe()}
            disabled={recipeLoading || !file}
            className="w-full rounded-2xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-800 disabled:opacity-50"
          >
            {recipeLoading ? "레시피 작성 중..." : "이 음식으로 레시피 만들기"}
          </button>
          {!file && (
            <p className="text-center text-xs text-stone-400">
              레시피는 방금 올린 사진이 있어야 만들 수 있습니다. 사진을 다시 선택하세요.
            </p>
          )}
        </>
      )}

      {recipe && <RecipeCard recipe={recipe} />}
    </div>
  );
}
