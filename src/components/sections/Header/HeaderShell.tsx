"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";

import styles from "./Header.module.css";

const REVEAL_AFTER_PX = 40;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > REVEAL_AFTER_PX;

type HeaderShellProps = { revealOnScroll: boolean; children: ReactNode };

/** The <header> element; on the home page it can stay hidden over the hero until the visitor scrolls. */
export function HeaderShell({ revealOnScroll, children }: HeaderShellProps) {
  const isHome = usePathname() === "/";
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);
  const overlay = revealOnScroll && isHome;

  return <header className={clsx(styles.header, overlay && styles.overlay, overlay && scrolled && styles.revealed)}>{children}</header>;
}
