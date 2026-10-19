"use client";

import { useId, useState } from "react";

import { uploadMedia, type UploadFolder } from "@/lib/admin/uploadImage";

import styles from "./ImageUploader.module.css";

type ImageUploaderProps = {
  folder: UploadFolder;
  label?: string;
  allowVideo?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  /** Called with the public URL once the file is stored. */
  onUploaded: (url: string) => Promise<void> | void;
};

/** File picker that uploads to storage and hands back the URL. */
export function ImageUploader({
  folder,
  label = "העלאת תמונה",
  allowVideo = false,
  multiple = false,
  maxFiles,
  disabled = false,
  onUploaded,
}: ImageUploaderProps) {
  const id = useId();
  const [status, setStatus] = useState<{ busy: boolean; error: string | null; progress: string | null }>({
    busy: false,
    error: null,
    progress: null,
  });

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    if (maxFiles !== undefined && files.length > maxFiles) {
      setStatus({ busy: false, error: `אפשר לבחור עד ${maxFiles} תמונות נוספות`, progress: null });
      return;
    }

    setStatus({ busy: true, error: null, progress: null });
    let uploaded = 0;
    try {
      for (const [index, file] of files.entries()) {
        setStatus({ busy: true, error: null, progress: `מעלים ${index + 1} מתוך ${files.length}…` });
        const result = await uploadMedia(file, folder, allowVideo);
        if (!result.ok) throw new Error(result.message);
        await onUploaded(result.url);
        uploaded += 1;
      }
      setStatus({ busy: false, error: null, progress: null });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "ההעלאה נכשלה. נסו שוב.";
      const partial = uploaded > 0 ? ` הועלו ${uploaded} מתוך ${files.length}.` : "";
      setStatus({ busy: false, error: `${reason}${partial}`, progress: null });
    }
  }

  return (
    <div className={styles.uploader}>
      <label htmlFor={id} className={styles.button} aria-disabled={disabled || status.busy}>
        {status.progress ?? (status.busy ? "מעלים…" : label)}
      </label>
      <input
        id={id}
        type="file"
        accept={allowVideo ? "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"}
        multiple={multiple}
        disabled={disabled || status.busy}
        className="visually-hidden"
        onChange={(e) => {
          void handleFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {status.error && (
        <p role="alert" className={styles.error}>
          {status.error}
        </p>
      )}
    </div>
  );
}
