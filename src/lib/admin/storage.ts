// Helpers for the public "media" storage bucket (used on server and client).

const PUBLIC_PREFIX = "/storage/v1/object/public/media/";

/** Path inside the bucket for one of our own public URLs, or null for anything else (e.g. /demo images). */
export function storagePathFromUrl(url: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(base).origin || !parsed.pathname.startsWith(PUBLIC_PREFIX)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(PUBLIC_PREFIX.length));
    return /^[a-z-]+\/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif|gif|mp4|webm)$/.test(path) ? path : null;
  } catch {
    return null;
  }
}

export function publicUrlForPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return new URL(`${PUBLIC_PREFIX}${path}`, base).href;
}
