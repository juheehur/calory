import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-stone-500">이 음식으로 만드는 레시피</p>
        <h2 className="mt-1 text-xl font-semibold text-stone-900">{recipe.dishName}</h2>
        <p className="mt-1 text-xs text-stone-500">
          {recipe.servings}인분 · 약 {recipe.timeMinutes}분
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-800">재료</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          {recipe.ingredients.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-800">순서</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-stone-700">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      {recipe.tips && <p className="text-sm leading-relaxed text-stone-600">{recipe.tips}</p>}
    </section>
  );
}
