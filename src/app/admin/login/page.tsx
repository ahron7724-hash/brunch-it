import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm/LoginForm";
import { getAdminUser } from "@/lib/auth/admin";

import styles from "./login.module.css";

export const metadata: Metadata = { title: "כניסה לניהול", robots: { index: false } };

type LoginPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getAdminUser()) redirect("/admin");
  const linkError = (await searchParams).error === "link";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>כניסה לניהול האתר</h1>
        <p className={styles.text}>הקלידו את כתובת הדוא״ל שלכם, ונשלח קישור כניסה חד-פעמי.</p>
        {linkError && (
          <p role="alert" className={styles.error}>
            הקישור אינו תקף או שפג תוקפו. נא לבקש קישור חדש.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
