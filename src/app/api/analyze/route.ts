import { NextResponse } from "next/server";
import { fileToDataUrl, readImageFile } from "@/lib/image-input";
import { requireOpenAI, TEXT_MODEL } from "@/lib/openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeResult, MealItem } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

const MODEL = TEXT_MODEL;

const DISCLAIMER =
  "사진은 추정값이며 실제 조리법·양에 따라 다를 수 있습니다. 의료·영양 상담이 아닙니다.";

const calorieSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "isFood",
    "errorMessage",
    "totalKcal",
    "proteinG",
    "carbG",
    "fatG",
    "summary",
    "items",
  ],
  properties: {
    isFood: { type: "boolean" },
    errorMessage: { type: ["string", "null"] },
    totalKcal: { type: "number" },
    proteinG: { type: "number" },
    carbG: { type: "number" },
    fatG: { type: "number" },
    summary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "portionEstimate",
          "kcal",
          "proteinG",
          "carbG",
          "fatG",
          "confidence",
        ],
        properties: {
          name: { type: "string" },
          portionEstimate: { type: "string" },
          kcal: { type: "number" },
          proteinG: { type: "number" },
          carbG: { type: "number" },
          fatG: { type: "number" },
          confidence: { type: "number" },
        },
      },
    },
  },
} as const;

type ModelPayload = {
  isFood: boolean;
  errorMessage: string | null;
  totalKcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  summary: string;
  items: MealItem[];
};

export async function POST(request: Request) {
  try {
    requireOpenAI();
  } catch {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const limited = rateLimit(`${clientIp(request.headers)}:analyze`);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `요청이 너무 많습니다. ${limited.retryAfterSec}초 후에 다시 시도하세요.`,
      },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const parsedFile = readImageFile(form.get("image"));
  if ("error" in parsedFile) {
    return NextResponse.json({ error: parsedFile.error }, { status: 400 });
  }
  const notes = String(form.get("notes") ?? "").slice(0, 500);
  const { buffer, dataUrl } = await fileToDataUrl(parsedFile.file, parsedFile.mime);
  const mime = parsedFile.mime;

  const openai = requireOpenAI();

  let parsed: ModelPayload;
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "calorie_estimate",
          strict: true,
          schema: calorieSchema,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You estimate calories from meal photos for a Korean user. Reply in Korean food names. If the image is not food, set isFood=false and explain in errorMessage. Estimate portions; if uncertain, use a conservative mid-range and lower confidence (0-1). totalKcal should equal the sum of item kcal as closely as possible.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this meal photo and estimate calories and macros.${notes ? ` User notes: ${notes}` : ""}`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "모델 응답이 비었습니다." }, { status: 502 });
    }
    parsed = JSON.parse(raw) as ModelPayload;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "칼로리 분석에 실패했습니다. 잠시 후 다시 시도하세요." },
      { status: 502 },
    );
  }

  if (!parsed.isFood) {
    return NextResponse.json(
      { error: parsed.errorMessage || "사진에서 음식을 찾지 못했습니다." },
      { status: 422 },
    );
  }

  const result: AnalyzeResult = {
    totalKcal: Math.round(parsed.totalKcal),
    macros: {
      proteinG: round1(parsed.proteinG),
      carbG: round1(parsed.carbG),
      fatG: round1(parsed.fatG),
    },
    items: parsed.items.map((item) => ({
      ...item,
      kcal: Math.round(item.kcal),
      proteinG: round1(item.proteinG),
      carbG: round1(item.carbG),
      fatG: round1(item.fatG),
      confidence: Math.min(1, Math.max(0, item.confidence)),
    })),
    summary: parsed.summary,
    disclaimer: DISCLAIMER,
    saved: false,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const mealId = crypto.randomUUID();
    const ext = extensionFor(mime);
    const imagePath = `${user.id}/${mealId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("meal-photos")
      .upload(imagePath, buffer, { contentType: mime, upsert: false });

    const storedPath = uploadError ? null : imagePath;
    if (uploadError) {
      console.error(uploadError);
    }

    const { error: insertError } = await supabase.from("meals").insert({
      id: mealId,
      user_id: user.id,
      eaten_at: new Date().toISOString(),
      image_path: storedPath,
      total_kcal: result.totalKcal,
      protein_g: result.macros.proteinG,
      carb_g: result.macros.carbG,
      fat_g: result.macros.fatG,
      items: result.items,
      notes: notes || null,
      ai_summary: result.summary,
      raw_model: MODEL,
    });

    if (!insertError) {
      result.saved = true;
      result.mealId = mealId;
      if (storedPath) {
        const { data: signed } = await supabase.storage
          .from("meal-photos")
          .createSignedUrl(storedPath, 3600);
        result.imageUrl = signed?.signedUrl ?? null;
      }
    } else {
      console.error(insertError);
    }
  }

  return NextResponse.json(result);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function extensionFor(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("heif")) return "heif";
  return "jpg";
}
