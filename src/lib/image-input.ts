const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/jpg",
]);

export function readImageFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File)) {
    return { error: "사진을 올려 주세요." as const };
  }
  if (file.size > MAX_BYTES) {
    return { error: "이미지는 8MB 이하여야 합니다." as const };
  }
  const mime = file.type || "image/jpeg";
  if (!ALLOWED.has(mime)) {
    return { error: "jpeg, png, webp, heic 이미지만 지원합니다." as const };
  }
  return { file, mime };
}

export async function fileToDataUrl(file: File, mime: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
}
