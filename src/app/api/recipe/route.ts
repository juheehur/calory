import { NextResponse } from "next/server";
import { fileToDataUrl, readImageFile } from "@/lib/image-input";
import { requireOpenAI, TEXT_MODEL } from "@/lib/openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Recipe } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

const recipeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["dishName", "servings", "timeMinutes", "ingredients", "steps", "tips"],
  properties: {
    dishName: { type: "string" },
    servings: { type: "number" },
    timeMinutes: { type: "number" },
    ingredients: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
    tips: { type: "string" },
  },
} as const;

export async function POST(request: Request) {
  try {
    requireOpenAI();
  } catch {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const limited = rateLimit(`${clientIp(request.headers)}:recipe`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${limited.retryAfterSec}초 후에 다시 시도하세요.` },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const parsedFile = readImageFile(form.get("image"));
  if ("error" in parsedFile) {
    return NextResponse.json({ error: parsedFile.error }, { status: 400 });
  }

  const notes = String(form.get("notes") ?? "").slice(0, 500);
  const { dataUrl } = await fileToDataUrl(parsedFile.file, parsedFile.mime);
  const openai = requireOpenAI();

  try {
    const completion = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: { name: "home_recipe", strict: true, schema: recipeSchema },
      },
      messages: [
        {
          role: "system",
          content:
            "You write home-cook recipes in Korean based on a meal photo. Infer the dish, list realistic Korean pantry ingredients with amounts, and numbered steps. Keep it practical for 1-2 servings unless the plate is clearly larger.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a recipe to recreate this food at home.${notes ? ` Notes: ${notes}` : ""}`,
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "레시피를 만들지 못했습니다." }, { status: 502 });
    }
    const recipe = JSON.parse(raw) as Recipe;
    return NextResponse.json(recipe);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "레시피 생성에 실패했습니다." }, { status: 502 });
  }
}
