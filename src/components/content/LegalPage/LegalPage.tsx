import clsx from "clsx";
import type { ReactNode } from "react";

import { PageIntro } from "@/components/ui/PageIntro/PageIntro";

import styles from "./LegalPage.module.css";

type LegalPageProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

/** Shared layout for the accessibility statement, privacy policy and terms. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <>
      <PageIntro title={title} description={`עודכן לאחרונה: ${updated}`} />
      <div className={clsx("container", styles.body)}>{children}</div>
    </>
  );
}

type LegalSectionProps = { title: string; children: ReactNode };

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}
