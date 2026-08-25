export const DAILY_TARGETS = {
  kcal: 2000,
  proteinG: 60,
  carbG: 250,
  fatG: 55,
};

export type MacroTotals = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

export function emptyTotals(): MacroTotals {
  return { kcal: 0, proteinG: 0, carbG: 0, fatG: 0 };
}

export function addMeal(
  totals: MacroTotals,
  meal: { kcal: number; proteinG: number; carbG: number; fatG: number },
): MacroTotals {
  return {
    kcal: totals.kcal + meal.kcal,
    proteinG: totals.proteinG + meal.proteinG,
    carbG: totals.carbG + meal.carbG,
    fatG: totals.fatG + meal.fatG,
  };
}
