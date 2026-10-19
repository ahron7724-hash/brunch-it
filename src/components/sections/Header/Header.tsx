import clsx from "clsx";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo/Logo";
import { NAV_LINKS } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/settings/defaults";

import styles from "./Header.module.css";
import { HeaderCart } from "./HeaderCart";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu } from "./MobileMenu";

type HeaderProps = { settings: SiteSettings };

export function Header({ settings }: HeaderProps) {
  return (
    <HeaderShell revealOnScroll={settings.headerOnScroll}>
      <div className={styles.main}>
        <div className={clsx("container", styles.inner)}>
          <div className={styles.side}>
            <nav aria-label="ראשי" className={styles.nav}>
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <MobileMenu />
          </div>

          <Link href="/" aria-label={`${settings.businessName}, דף הבית`}>
            <Logo name={settings.businessName} tagline={settings.tagline} logoUrl={settings.logoUrl ?? "/brand/logo-horizontal.png"} />
          </Link>

          <div className={styles.sideEnd}>
            <HeaderCart />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
