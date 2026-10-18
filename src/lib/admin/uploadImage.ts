"use client";

import { createClient } from "@/lib/supabase/client";

import { publicUrlForPath } from "./storage";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DIMENSION = 2000;

export type UploadFolder = "products" | "categories" | "hero" | "strips" | "gallery" | "pages" | "testimonials" | "brand";

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Uploads an image (resized to ≤2000px and converted to WebP in the browser) or a short video
 * to the public media bucket under a random name. Storage policies allow this for admins only.
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

  const body = isImage ? await toWebp(file) : file;
  const extension = body.type === "image/webp" ? "webp" : (file.type.split("/")[1] ?? "bin");
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, body, { contentType: body.type, cacheControl: "31536000" });
  if (error) return { ok: false, message: "ההעלאה נכשלה. נסו שוב." };
  return { ok: true, url: publicUrlForPath(path) };
}

/** Downscales and re-encodes an image as WebP. Falls back to the original if the browser can't. */
async function toWebp(file: File): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
  } catch {
    return file;
  }
}
