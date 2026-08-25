import { NextResponse } from "next/server";
import { NUTRITION_DISCLAIMER, requireOpenAI, TEXT_MODEL } from "@/lib/openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { addMeal, DAILY_TARGETS, emptyTotals } from "@/lib/nutrition-targets";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeResult, NutritionAdvice } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

const adviceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "gaps", "nextFoods"],
  properties: {
    summary: { type: "string" },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nutrient", "status", "current", "target", "unit", "advice"],
        properties: {
          nutrient: { type: "string" },
          status: { type: "string", enum: ["low", "ok", "high"] },
          current: { type: "number" },
          target: { type: "number" },
          unit: { type: "string" },
          advice: { type: "string" },
        },
      },
    },
    nextFoods: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "reason"],
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

export async function POST(request: Request) {
  try {
    requireOpenAI();
  } catch {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const limited = rateLimit(`${clientIp(request.headers)}:nutrition`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${limited.retryAfterSec}초 후에 다시 시도하세요.` },
      { status: 429 },
    );
  }

  let guestMeal: AnalyzeResult | null = null;
  try {
    const body = await request.json();
    if (body?.meal) guestMeal = body.meal as AnalyzeResult;
  } catch {
    guestMeal = null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let totals = emptyTotals();
  let periodLabel = "최근 한 끼";
  const dishNames: string[] = [];

  if (user) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("meals")
      .select("total_kcal, protein_g, carb_g, fat_g, items, ai_summary")
      .eq("user_id", user.id)
      .gte("eaten_at", start.toISOString());

    for (const row of data ?? []) {
      totals = addMeal(totals, {
        kcal: Number(row.total_kcal),
        proteinG: Number(row.protein_g),
        carbG: Number(row.carb_g),
        fatG: Number(row.fat_g),
      });
      const items = (row.items ?? []) as { name?: string }[];
      for (const item of items) {
        if (item.name) dishNames.push(item.name);
      }
    }
    periodLabel = "오늘 기록된 식사";
  } else if (guestMeal) {
    totals = {
      kcal: guestMeal.totalKcal,
      proteinG: guestMeal.macros.proteinG,
      carbG: guestMeal.macros.carbG,
      fatG: guestMeal.macros.fatG,
    };
    dishNames.push(...guestMeal.items.map((item) => item.name));
  }

  if (totals.kcal === 0) {
    return NextResponse.json(
      { error: "먼저 음식 사진을 분석하거나, 로그인 후 식사를 기록하세요." },
      { status: 400 },
    );
  }

  const openai = requireOpenAI();
  try {
    const completion = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: { name: "nutrition_advice", strict: true, schema: adviceSchema },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a Korean diet coach. Compare intake to general adult daily targets. Recommend specific Korean foods for gaps. Never claim medical diagnosis. status low means below ~80% of target, high above ~120%, else ok. Include fiber/vegetables/protein qualitatively if macros look carb-heavy.",
        },
        {
          role: "user",
          content: JSON.stringify({
            periodLabel,
            intake: totals,
            dailyTargets: DAILY_TARGETS,
            foods: dishNames.slice(0, 20),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "추천을 만들지 못했습니다." }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as Omit<NutritionAdvice, "periodLabel" | "disclaimer">;
    const result: NutritionAdvice = {
      ...parsed,
      periodLabel,
      disclaimer: NUTRITION_DISCLAIMER,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "영양 추천에 실패했습니다." }, { status: 502 });
  }
}
