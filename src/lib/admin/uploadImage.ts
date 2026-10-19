"use client";

import { createClient } from "@/lib/supabase/client";

import { publicUrlForPath } from "./storage";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DIMENSION = 2000;
const MAX_HERO_ORIGINAL_BYTES = 8 * 1024 * 1024;
const MAX_HERO_DIMENSION = 4096;
const HERO_WEBP_QUALITY = 0.92;

export type UploadFolder = "products" | "trays" | "categories" | "hero" | "strips" | "gallery" | "pages" | "testimonials" | "brand";

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Uploads an image (optimized in the browser) or a short video to the public media bucket
 * under a random name. Hero images keep their original quality unless they exceed 8 MB.
 * Storage policies allow this for admins only.
 */
export async function uploadMedia(file: File, folder: UploadFolder, allowVideo = false): Promise<UploadResult> {
  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = allowVideo && VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    return { ok: false, message: allowVideo ? "אפשר להעלות תמונה (JPG, PNG, WEBP) או סרטון MP4" : "אפשר להעלות רק תמונה מסוג JPG, PNG או WEBP" };
  }
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    return { ok: false, message: isVideo ? "הסרטון גדול מ-50MB" : "התמונה גדולה מ-15MB" };
  }

  const body = isImage ? (folder === "hero" ? await toHeroWebp(file) : await toWebp(file)) : file;
  const extension = body.type === "image/webp" ? "webp" : (file.type.split("/")[1] ?? "bin");
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, body, { contentType: body.type, cacheControl: "31536000" });
  if (error) return { ok: false, message: "ההעלאה נכשלה. נסו שוב." };
  return { ok: true, url: publicUrlForPath(path) };
}

/** Keep hero originals unless large; gently optimize oversized hero files for responsive delivery. */
async function toHeroWebp(file: File): Promise<Blob> {
  if (file.size <= MAX_HERO_ORIGINAL_BYTES) return file;
  return toWebp(file, MAX_HERO_DIMENSION, HERO_WEBP_QUALITY, true);
}

/** Downscales and re-encodes an image as WebP. Falls back to the original if the browser can't. */
async function toWebp(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = 0.85,
  keepOriginalIfLarger = false
): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return file;
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const optimized = await canvas.convertToBlob({ type: "image/webp", quality });
    return keepOriginalIfLarger && optimized.size >= file.size ? file : optimized;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
