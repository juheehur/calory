export type MealItem = {
  name: string;
  portionEstimate: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  confidence: number;
};

export type AnalyzeResult = {
  totalKcal: number;
  macros: {
    proteinG: number;
    carbG: number;
    fatG: number;
  };
  items: MealItem[];
  summary: string;
  disclaimer: string;
  saved?: boolean;
  mealId?: string;
  imageUrl?: string | null;
};

export type MealRow = {
  id: string;
  user_id: string;
  eaten_at: string;
  image_path: string | null;
  total_kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  items: MealItem[];
  notes: string | null;
  ai_summary: string | null;
  raw_model: string | null;
};

export type Recipe = {
  dishName: string;
  servings: number;
  timeMinutes: number;
  ingredients: string[];
  steps: string[];
  tips: string;
};

export type NutrientGap = {
  nutrient: string;
  status: "low" | "ok" | "high";
  current: number;
  target: number;
  unit: string;
  advice: string;
};

export type NutritionAdvice = {
  periodLabel: string;
  summary: string;
  gaps: NutrientGap[];
  nextFoods: { name: string; reason: string }[];
  disclaimer: string;
};
