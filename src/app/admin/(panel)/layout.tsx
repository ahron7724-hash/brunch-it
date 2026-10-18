import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { requireAdminPage } from "@/lib/auth/admin";

import { signOut } from "./actions";
import styles from "./panel.module.css";

export const metadata: Metadata = { title: "ניהול", robots: { index: false } };

export default async function AdminPanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdminPage();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>ניהול האתר</p>
        <AdminNav />
        <div className={styles.account}>
          <span className={styles.email}>{user.email}</span>
          <form action={signOut}>
            <button type="submit" className={styles.signOut}>
              יציאה
            </button>
          </form>
          <a href="/" target="_blank" rel="noopener noreferrer" className={styles.viewSite}>
            צפייה באתר ↗
          </a>
        </div>
      </aside>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
