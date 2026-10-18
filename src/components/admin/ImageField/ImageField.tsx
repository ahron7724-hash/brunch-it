"use client";

import Image from "next/image";
import { useState } from "react";

import { ImageUploader } from "@/components/admin/ImageUploader/ImageUploader";
import type { UploadFolder } from "@/lib/admin/uploadImage";

import styles from "./ImageField.module.css";

type ImageFieldProps = {
  name: string;
  label: string;
  folder: UploadFolder;
  defaultUrl: string | null;
  hint?: string;
};

/** Single image inside a form: preview, replace, remove. Submits the URL in a hidden input. */
export function ImageField({ name, label, folder, defaultUrl, hint }: ImageFieldProps) {
  const [url, setUrl] = useState(defaultUrl ?? "");

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
      <input type="hidden" name={name} value={url} />
      <div className={styles.body}>
        {url && (
          <span className={styles.preview}>
            <Image src={url} alt="" fill sizes="8rem" className={styles.image} />
          </span>
        )}
        <div className={styles.actions}>
          <ImageUploader folder={folder} label={url ? "החלפת תמונה" : "העלאת תמונה"} onUploaded={setUrl} />
          {url && (
            <button type="button" className={styles.remove} onClick={() => setUrl("")}>
              הסרת התמונה
            </button>
          )}
        </div>
      </div>
      {url !== (defaultUrl ?? "") && <span className={styles.unsaved}>לא נשמר עדיין – לחצו &quot;שמירה&quot;</span>}
    </div>
  );
}
