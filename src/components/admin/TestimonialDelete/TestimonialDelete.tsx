"use client";

import { deleteTestimonial } from "@/app/admin/(panel)/home/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";

type TestimonialDeleteProps = { testimonialId: string };

export function TestimonialDelete({ testimonialId }: TestimonialDeleteProps) {
  return <DeleteButton label="מחיקת ההמלצה" confirmText="למחוק את ההמלצה?" onDelete={() => deleteTestimonial(testimonialId)} />;
}
