"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Panel } from "@/components/admin/Panel/Panel";
import { ProductImagesField, type ProductImageValue } from "@/components/admin/ProductImagesField/ProductImagesField";
import { fromEditableRows, RowsField, toEditableRows, type Column } from "@/components/admin/RowsField/RowsField";
import type { AdminActionResult } from "@/lib/auth/admin";

import { SaveBar } from "./SaveBar";
import styles from "./ProductEditor.module.css";

const SIZE_COLUMNS: Column[] = [
  { key: "label", label: "שם הגודל", placeholder: "למשל: בינוני", maxLength: 60, grow: 2 },
  { key: "price", label: "מחיר (₪)", type: "number", grow: 1 },
  { key: "unitCount", label: "יחידות במארז", type: "number", grow: 1 },
  { key: "serves", label: "מתאים ל…", placeholder: "למשל: 10–12 סועדים", maxLength: 80, grow: 2 },
];

const OPTION_COLUMNS: Column[] = [
  { key: "groupName", label: "קבוצה", placeholder: "למשל: טעם", maxLength: 60, grow: 1 },
  { key: "label", label: "אפשרות", placeholder: "למשל: שוקולד", maxLength: 80, grow: 2 },
  { key: "extraPrice", label: "תוספת (₪)", type: "number", grow: 1 },
];

type ProductEditorProps = {
  action: (prev: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult>;
  images: { id: string; url: string; alt: string }[];
  sizes: Record<string, string>[];
  options: Record<string, string>[];
  /** The details fields (rendered on the server), placed inside the same form. */
  children: ReactNode;
};

/** The whole product page as one form with a single "save product" button. */
export function ProductEditor({ action, images: savedImages, sizes: savedSizes, options: savedOptions, children }: ProductEditorProps) {
  const [images, setImages] = useState<ProductImageValue[]>(() => savedImages.map((img) => ({ ...img, _key: img.id })));
  const [sizes, setSizes] = useState(() => toEditableRows(savedSizes));
  const [options, setOptions] = useState(() => toEditableRows(savedOptions));
  const [dirty, setDirty] = useState(false);
  // The last save result stays visible until the next edit.
  const [showResult, setShowResult] = useState(false);

  // After a save the server sends fresh data (with new ids); take it without remounting, so the message stays.
  const [synced, setSynced] = useState({ savedImages, savedSizes, savedOptions });
  if (synced.savedImages !== savedImages || synced.savedSizes !== savedSizes || synced.savedOptions !== savedOptions) {
    setSynced({ savedImages, savedSizes, savedOptions });
    setImages(savedImages.map((img) => ({ ...img, _key: img.id })));
    setSizes(toEditableRows(savedSizes));
    setOptions(toEditableRows(savedOptions));
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
      <input type="hidden" name="images" value={JSON.stringify(images.map(({ id, url, alt }) => ({ id, url, alt })))} />
      <input type="hidden" name="sizes" value={JSON.stringify(fromEditableRows(sizes, SIZE_COLUMNS))} />
      <input type="hidden" name="options" value={JSON.stringify(fromEditableRows(options, OPTION_COLUMNS))} />

      <Panel title="תמונות" description="עד 3 תמונות. הראשונה מופיעה בקטלוג. אפשר לשנות סדר עם החצים.">
        <ProductImagesField images={images} onChange={change(setImages)} />
      </Panel>

      <Panel title="גדלים ומחירים" description="עד 3 גדלים, לכל גודל מחיר משלו. מוצר עם גודל אחד מוצג בלי בחירה. יחידות במארז משמשות לחישוב המתכון והמלאי (למשל 20 קישים).">
        <RowsField
          columns={SIZE_COLUMNS}
          rows={sizes}
          onChange={change(setSizes)}
          maxRows={3}
          addLabel="הוספת גודל"
          emptyText="עדיין אין גדלים. בלי גודל ומחיר אי אפשר להציג את המוצר באתר."
        />
      </Panel>

      <Panel title="טעמים ותוספות" description="הלקוח בוחר אפשרות אחת מכל קבוצה. תוספת 0 = בלי תוספת מחיר. אפשר להשאיר ריק.">
        <RowsField columns={OPTION_COLUMNS} rows={options} onChange={change(setOptions)} maxRows={30} addLabel="הוספת אפשרות" emptyText="אין טעמים לבחירה במוצר הזה." />
      </Panel>

      <Panel title="פרטי המוצר">{children}</Panel>

      <SaveBar pending={isPending} dirty={dirty} result={showResult ? state : null} />
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
