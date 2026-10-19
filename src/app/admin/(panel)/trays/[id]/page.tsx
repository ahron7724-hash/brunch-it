import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { TrayDelete } from "@/components/admin/TrayEditor/TrayDelete";
import { TrayDetailsFields } from "@/components/admin/TrayEditor/TrayDetailsFields";
import { TrayEditor } from "@/components/admin/TrayEditor/TrayEditor";
import { getAdminTray } from "@/lib/admin/trays";
import { getSettings } from "@/lib/settings/get-settings";

import { saveTray } from "../actions";

type EditTrayPageProps = { params: Promise<{ id: string }> };

export default async function EditTrayPage({ params }: EditTrayPageProps) {
  const [tray, settings] = await Promise.all([getAdminTray((await params).id), getSettings()]);
  if (!tray) notFound();

  return (
    <>
      <AdminHeader
        title={tray.title}
        description={tray.is_active ? "מוצג באתר" : "מוסתר – לא מופיע באתר"}
        back={{ href: "/admin/trays", label: "כל המגשים" }}
      >
        {tray.is_active && (
          <a href={`/tray/${encodeURIComponent(tray.slug)}`} target="_blank" rel="noopener noreferrer">
            צפייה בדף המגש ↗
          </a>
        )}
      </AdminHeader>

      <TrayEditor
        action={saveTray.bind(null, tray.id)}
        sizes={tray.tray_sizes.map((s) => ({ id: s.id, label: s.label, capacity: s.capacity === null ? "" : String(s.capacity) }))}
        items={tray.tray_items.map((i) => ({ id: i.id, name: i.name, price: String(i.price), imageUrl: i.image_url ?? "", isActive: i.is_active }))}
      >
        <TrayDetailsFields tray={tray} defaultLeadTimeHours={settings.defaultLeadTimeHours} />
      </TrayEditor>

      <TrayDelete trayId={tray.id} />
    </>
  );
}
