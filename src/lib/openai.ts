import OpenAI from "openai";

export const TEXT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini";

export function requireOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

export const NUTRITION_DISCLAIMER =
  "추정·일반 권장량 기준이며 의료·영양 상담이 아닙니다. 개인 건강 상태에 따라 다를 수 있습니다.";
