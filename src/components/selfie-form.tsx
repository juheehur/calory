"use client";

import { useState } from "react";

export function SelfieForm() {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [food, setFood] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [foodNote, setFoodNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSelfie(file: File | null) {
    setSelfie(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selfie) {
      setError("셀카를 먼저 선택하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    const body = new FormData();
    body.set("selfie", selfie);
    if (food) body.set("food", food);
    if (foodNote.trim()) body.set("foodNote", foodNote.trim());

    try {
      const response = await fetch("/api/selfie", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "변환에 실패했습니다.");
        return;
      }
      setResult(data.imageDataUrl as string);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">셀카를 식사 사진으로</h1>
          <p className="mt-1 text-sm text-stone-500">
            얼굴은 유지한 채, 음식을 먹고 있는 장면으로 바꿔 줍니다. 결과는 AI 생성 이미지입니다.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="셀카 미리보기" className="max-h-56 w-full rounded-xl object-cover" />
          ) : (
            <span className="text-sm font-medium text-orange-900">전면 카메라로 셀카 찍기</span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="sr-only"
            onChange={(e) => onSelfie(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="block text-sm text-stone-600">
          (선택) 먹을 음식 사진
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm"
            onChange={(e) => setFood(e.target.files?.[0] ?? null)}
          />
        </label>

        <input
          value={foodNote}
          onChange={(e) => setFoodNote(e.target.value)}
          placeholder="먹을 음식 (예: 김치찌개, 초밥)"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-orange-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "만드는 중..." : "식사 사진으로 바꾸기"}
        </button>
      </form>

      {result && (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="생성된 식사 사진" className="w-full object-cover" />
        </div>
      )}
    </div>
  );
}
