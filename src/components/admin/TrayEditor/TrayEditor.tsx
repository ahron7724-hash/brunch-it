"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Panel } from "@/components/admin/Panel/Panel";
import { SaveBar } from "@/components/admin/ProductEditor/SaveBar";
import { fromEditableRows, RowsField, toEditableRows, type Column } from "@/components/admin/RowsField/RowsField";
import type { AdminActionResult } from "@/lib/auth/admin";

import styles from "./TrayEditor.module.css";
import { TrayItemsField, type TrayItemValue } from "./TrayItemsField";

const SIZE_COLUMNS: Column[] = [
  { key: "label", label: "שם הגודל", placeholder: "למשל: מגש 12", maxLength: 60, grow: 2 },
  { key: "capacity", label: "יחידות במגש (ריק = בודדים)", type: "number", grow: 1 },
];

type SavedItem = { id: string; name: string; price: string; imageUrl: string; isActive: boolean };

type TrayEditorProps = {
  action: (prev: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult>;
  sizes: Record<string, string>[];
  items: SavedItem[];
  /** The details fields (rendered on the server), placed inside the same form. */
  children: ReactNode;
};

/** The whole tray page as one form with a single save button. */
export function TrayEditor({ action, sizes: savedSizes, items: savedItems, children }: TrayEditorProps) {
  const [sizes, setSizes] = useState(() => toEditableRows(savedSizes));
  const [items, setItems] = useState<TrayItemValue[]>(() => savedItems.map((i) => ({ ...i, _key: i.id })));
  const [dirty, setDirty] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // After a save the server sends fresh data (with new ids); take it without remounting, so the message stays.
  const [synced, setSynced] = useState({ savedSizes, savedItems });
  if (synced.savedSizes !== savedSizes || synced.savedItems !== savedItems) {
    setSynced({ savedSizes, savedItems });
    setSizes(toEditableRows(savedSizes));
    setItems(savedItems.map((i) => ({ ...i, _key: i.id })));
  }

  const [state, formAction, isPending] = useActionState(async (prev: AdminActionResult | null, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) setDirty(false);
    setShowResult(true);
    return result;
  }, null);

  // Warn before closing or reloading the tab with unsaved changes (a browser event: an external system).
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const markEdited = () => {
    setDirty(true);
    setShowResult(false);
  };

  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    markEdited();
  };

  return (
    <form onSubmit={(e) => submitWithoutReset(e, formAction)} onChange={markEdited} className={styles.form}>
      <input type="hidden" name="sizes" value={JSON.stringify(fromEditableRows(sizes, SIZE_COLUMNS))} />
      <input type="hidden" name="items" value={JSON.stringify(items.map(({ id, name, price, imageUrl, isActive }) => ({ id, name, price, imageUrl, isActive })))} />

      <Panel title="פרטי המגש">{children}</Panel>

      <Panel
        title="גדלי מגש"
        description="למשל: מגש 6, מגש 9, מגש 12. הלקוח ממלא בדיוק את מספר היחידות. משאירים את מספר היחידות ריק לגודל ״בודדים״: הלקוח בוחר כמה שרוצה."
      >
        <RowsField columns={SIZE_COLUMNS} rows={sizes} onChange={change(setSizes)} maxRows={10} addLabel="הוספת גודל" emptyText="עדיין אין גדלים." />
      </Panel>

      <Panel title="מה נכנס למגש" description="כל פריט עם מחיר ליחידה. המחיר של המגש הוא סכום היחידות שבו. פריט שלא מסומן ״זמין להזמנה״ לא מוצג באתר.">
        <TrayItemsField items={items} onChange={change(setItems)} />
      </Panel>

      <SaveBar pending={isPending} dirty={dirty} result={showResult ? state : null} label="שמירת המגש" />
    </form>
  );
}

/**
 * Submits the form to the action without React's automatic form reset,
 * so typed values stay in place when the server rejects a save.
 */
function submitWithoutReset(event: FormEvent<HTMLFormElement>, dispatch: (formData: FormData) => void) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  startTransition(() => dispatch(formData));
}
