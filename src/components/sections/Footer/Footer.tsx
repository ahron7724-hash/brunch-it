import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { formatLeadTime } from "@/lib/leadTime";
import { LEGAL_LINKS, NAV_LINKS } from "@/lib/navigation";
import { mailtoHref, telHref } from "@/lib/security/safeHref";
import type { SiteSettings } from "@/lib/settings/defaults";

import styles from "./Footer.module.css";

type FooterProps = { settings: SiteSettings };

export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();
  const phoneHref = telHref(settings.phone);
  const emailHref = mailtoHref(settings.orderEmail);

  return (
    <footer className={styles.footer}>
      <div className={clsx("container", styles.columns)}>
        <div className={styles.brand}>
          <Image src="/brand/logo-round.png" alt={settings.businessName} width={160} height={160} className={styles.logo} />
        </div>

        <div className={styles.column}>
          <h2 className={clsx("eyebrow", styles.heading)}>הזמנות</h2>
          <p className={styles.text}>
            הזמנות מראש בלבד, לפחות {formatLeadTime(settings.defaultLeadTimeHours)} לפני מועד האיסוף
          </p>
          {settings.pickupAddress && <p className={styles.text}>איסוף: {settings.pickupAddress}</p>}
        </div>

        <div className={styles.column}>
          <h2 className={clsx("eyebrow", styles.heading)}>יצירת קשר</h2>
          {phoneHref && (
            <a href={phoneHref} className={clsx("ltr", styles.link)}>
              {settings.phone}
            </a>
          )}
          {emailHref && (
            <a href={emailHref} className={clsx("ltr", styles.link)}>
              {settings.orderEmail}
            </a>
          )}
          {settings.kashrutLine && <p className={styles.text}>{settings.kashrutLine}</p>}
        </div>

        <nav aria-label="קישורים" className={styles.column}>
          <h2 className={clsx("eyebrow", styles.heading)}>ניווט</h2>
          {[...NAV_LINKS, ...LEGAL_LINKS].map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={clsx("container", styles.bottom)}>
        © {year} {settings.businessName}
      </div>
    </footer>
  );
}
