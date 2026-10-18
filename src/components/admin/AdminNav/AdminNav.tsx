"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./AdminNav.module.css";

const LINKS = [
  { href: "/admin", label: "הזמנות" },
  { href: "/admin/production", label: "תוכנית עבודה" },
  { href: "/admin/inventory", label: "מלאי וקניות" },
  { href: "/admin/products", label: "מוצרים" },
  { href: "/admin/categories", label: "קטגוריות" },
  { href: "/admin/schedule", label: "מועדי איסוף" },
  { href: "/admin/delivery", label: "משלוחים" },
  { href: "/admin/home", label: "דף הבית" },
  { href: "/admin/pages", label: "אודות וכשרות" },
  { href: "/admin/settings", label: "עיצוב ופרטי העסק" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="ניהול">
      <ul role="list" className={styles.list}>
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/orders") : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} className={clsx(styles.link, active && styles.active)} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
