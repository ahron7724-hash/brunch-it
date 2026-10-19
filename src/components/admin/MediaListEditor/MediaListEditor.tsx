"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";

import { addMedia, deleteMedia, deleteMediaBatch, saveMediaOrder, type MediaListName } from "@/app/admin/(panel)/media/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";
import { ImageUploader } from "@/components/admin/ImageUploader/ImageUploader";
import { Button } from "@/components/ui/Button/Button";
import type { UploadFolder } from "@/lib/admin/uploadImage";

import styles from "./MediaListEditor.module.css";

export type MediaItem = { id: string; url: string; alt: string; caption?: string; isVideo?: boolean };

type MediaListEditorProps = {
  list: MediaListName;
  items: MediaItem[];
  folder: UploadFolder;
  max: number;
  allowVideo?: boolean;
  withCaption?: boolean;
};

/** Ordered list of images (hero slides, strips, gallery): upload, describe, reorder, delete. */
export function MediaListEditor({ list, items: initial, folder, max, allowVideo = false, withCaption = false }: MediaListEditorProps) {
  const [items, setItems] = useState(initial);
  const [syncedFrom, setSyncedFrom] = useState(initial);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  if (syncedFrom !== initial) {
    setSyncedFrom(initial);
    setItems(initial);
    setSelectedIds(new Set());
  }

  const canSelectMany = list === "stripTop" || list === "stripBottom";
  const edit = (id: string, field: "alt" | "caption", value: string) =>
    setItems((all) => all.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  const toggleSelected = (id: string) =>
    setSelectedIds((selected) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const move = (index: number, delta: number) =>
    setItems((all) => {
      const next = [...all];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + delta, 0, item);
      return next;
    });

  return (
    <div className={styles.editor}>
      <ul role="list" className={styles.grid}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.card}>
            {canSelectMany && (
              <label className={styles.selection}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelected(item.id)}
                  aria-label={`בחירת תמונה ${index + 1}`}
                />
                בחירה
              </label>
            )}
            <div className={styles.thumb}>
              {item.isVideo ? <span className={styles.video}>סרטון</span> : <Image src={item.url} alt="" fill sizes="(min-width: 40em) 16rem, 50vw" className={styles.image} />}
            </div>
            <input aria-label="תיאור קצר (לנגישות)" placeholder="תיאור קצר" value={item.alt} maxLength={200} onChange={(e) => edit(item.id, "alt", e.target.value)} className={styles.input} />
            {withCaption && (
              <input aria-label="כיתוב מתחת לתמונה" placeholder="כיתוב (למשל: בת מצווה)" value={item.caption ?? ""} maxLength={200} onChange={(e) => edit(item.id, "caption", e.target.value)} className={styles.input} />
            )}
            <div className={styles.controls}>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="הקדמה" className={styles.iconButton}>
                <ArrowUp size={14} strokeWidth={1.25} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="איחור" className={styles.iconButton}>
                <ArrowDown size={14} strokeWidth={1.25} aria-hidden="true" />
              </button>
              <DeleteButton onDelete={() => deleteMedia(list, item.id)} confirmText="למחוק?" />
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        {items.length < max ? (
          <ImageUploader
            folder={folder}
            allowVideo={allowVideo}
            multiple={canSelectMany}
            maxFiles={max - items.length}
            label={`הוספה (${items.length}/${max})`}
            onUploaded={async (url) => {
              const result = await addMedia(list, url, "");
              if (!result.ok) throw new Error(result.message);
              setMessage(null);
            }}
          />
        ) : (
          <p className={styles.note}>הגעת למקסימום ({max}).</p>
        )}
        {canSelectMany && selectedIds.size > 0 && (
          <Button
            variant="line"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm(`למחוק ${selectedIds.size} תמונות שנבחרו?`)) return;
              startTransition(async () => {
                const ids = Array.from(selectedIds);
                const result = await deleteMediaBatch(list, ids);
                if (result.ok) {
                  setItems((all) => all.filter((item) => !selectedIds.has(item.id)));
                  setSelectedIds(new Set());
                }
                setMessage({ ok: result.ok, text: result.ok ? result.message ?? "התמונות שנבחרו נמחקו" : result.message });
              });
            }}
          >
            <Trash2 size={16} aria-hidden="true" />
            מחיקת {selectedIds.size} תמונות שנבחרו
          </Button>
        )}
        {items.length > 0 && (
          <Button
            variant="line"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await saveMediaOrder(list, items.map((i) => ({ id: i.id, alt: i.alt, caption: i.caption })));
                setMessage({ ok: result.ok, text: result.ok ? "הסדר והתיאורים נשמרו" : result.message });
              })
            }
          >
            שמירת סדר ותיאורים
          </Button>
        )}
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? styles.success : styles.error}>
          {message.text}
        </p>
      )}
    </div>
  );
}
