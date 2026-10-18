"use client";

import { useId, useState } from "react";

import { uploadMedia, type UploadFolder } from "@/lib/admin/uploadImage";

import styles from "./ImageUploader.module.css";

type ImageUploaderProps = {
  folder: UploadFolder;
  label?: string;
  allowVideo?: boolean;
  disabled?: boolean;
  /** Called with the public URL once the file is stored. */
  onUploaded: (url: string) => Promise<void> | void;
};

/** File picker that uploads to storage and hands back the URL. */
export function ImageUploader({ folder, label = "העלאת תמונה", allowVideo = false, disabled = false, onUploaded }: ImageUploaderProps) {
  const id = useId();
  const [status, setStatus] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus({ busy: true, error: null });
    const result = await uploadMedia(file, folder, allowVideo);
    if (!result.ok) {
      setStatus({ busy: false, error: result.message });
      return;
    }
    await onUploaded(result.url);
    setStatus({ busy: false, error: null });
  }

  return (
    <div className={styles.uploader}>
      <label htmlFor={id} className={styles.button} aria-disabled={disabled || status.busy}>
        {status.busy ? "מעלים…" : label}
      </label>
      <input
        id={id}
        type="file"
        accept={allowVideo ? "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"}
        disabled={disabled || status.busy}
        className="visually-hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
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
