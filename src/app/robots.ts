import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout"] }],
    sitemap: new URL("/sitemap.xml", base).href,
  };
}
