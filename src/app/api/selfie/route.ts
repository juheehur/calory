import { toFile } from "openai";
import { NextResponse } from "next/server";
import { readImageFile } from "@/lib/image-input";
import { IMAGE_MODEL, requireOpenAI } from "@/lib/openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireOpenAI();
  } catch {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const limited = rateLimit(`${clientIp(request.headers)}:selfie`, 5);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${limited.retryAfterSec}초 후에 다시 시도하세요.` },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const selfie = readImageFile(form.get("selfie"));
  if ("error" in selfie) {
    return NextResponse.json({ error: "셀카를 올려 주세요." }, { status: 400 });
  }
  if (selfie.mime.includes("heic") || selfie.mime.includes("heif")) {
    return NextResponse.json(
      { error: "셀카는 jpeg 또는 png로 올려 주세요." },
      { status: 400 },
    );
  }

  const foodNote = String(form.get("foodNote") ?? "").slice(0, 200);
  const food = form.get("food");
  const images = [
    await toFile(Buffer.from(await selfie.file.arrayBuffer()), "selfie.jpg", {
      type: selfie.mime,
    }),
  ];

  if (food instanceof File && food.size > 0) {
    const foodParsed = readImageFile(food);
    if (!("error" in foodParsed) && !foodParsed.mime.includes("heic")) {
      images.push(
        await toFile(Buffer.from(await foodParsed.file.arrayBuffer()), "food.jpg", {
          type: foodParsed.mime,
        }),
      );
    }
  }

  const dish = foodNote || "a tasty Korean home meal";
  const openai = requireOpenAI();

  try {
    const edited = await openai.images.edit({
      model: IMAGE_MODEL,
      image: images,
      prompt: `Photorealistic photo of the SAME person from the selfie, clearly recognizable face and identity, sitting at a table and eating ${dish}. Natural restaurant or home dining lighting, mid-shot, candid, no extra people, no text, no watermark. Keep hairstyle, skin tone, and facial features.`,
      size: "1024x1024",
      quality: "low",
      ...(!IMAGE_MODEL.includes("mini") ? { input_fidelity: "high" as const } : {}),
    });

    const b64 = edited.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "이미지를 만들지 못했습니다." }, { status: 502 });
    }
    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "셀카 변환에 실패했습니다. 이미지 모델 권한을 확인하세요." },
      { status: 502 },
    );
  }
}
