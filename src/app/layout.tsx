import type { Metadata } from "next";

import { getSettings } from "@/lib/settings/get-settings";
import { fontVariables } from "@/lib/theme/fonts";
import { themeStyle } from "@/lib/theme/theme-style";

import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: settings.businessName, template: `%s | ${settings.businessName}` },
    description: settings.heroSubtitle,
    openGraph: { locale: "he_IL", type: "website", siteName: settings.businessName },
  };
}

/** Document shell shared by the shop and the admin panel: language, direction, fonts and brand colors. */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <html lang="he" dir="rtl" className={fontVariables} style={themeStyle(settings)}>
      <body>{children}</body>
    </html>
  );
}
