"use client";

import clsx from "clsx";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { NAV_LINKS } from "@/lib/navigation";

import styles from "./MobileMenu.module.css";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
        className={styles.toggle}
      >
        {open ? <X size={22} strokeWidth={1.25} aria-hidden="true" /> : <Menu size={22} strokeWidth={1.25} aria-hidden="true" />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="ראשי" className={styles.panel}>
          <ul role="list" className={clsx("container", styles.list)}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
