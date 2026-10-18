import { z } from "zod";

import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { MediaListEditor } from "@/components/admin/MediaListEditor/MediaListEditor";
import { Panel } from "@/components/admin/Panel/Panel";
import { TestimonialDelete } from "@/components/admin/TestimonialDelete/TestimonialDelete";
import { TestimonialFields } from "@/components/admin/TestimonialFields/TestimonialFields";
import { getAdminMedia } from "@/lib/admin/media";
import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

import { createTestimonial, updateTestimonial } from "./actions";

const testimonialRow = z.object({
  id: z.string().uuid(),
  client_name: z.string(),
  event_label: z.string().nullable(),
  content: z.string(),
  rating: z.number().int(),
  sort_order: z.number().int(),
  is_published: z.boolean(),
});

export default async function AdminHomePage() {
  const supabase = await createClient();
  const [media, testimonialsRes] = await Promise.all([
    getAdminMedia(),
    supabase.from("testimonials").select("id, client_name, event_label, content, rating, sort_order, is_published").order("sort_order"),
  ]);
  const testimonials = parseRows(testimonialRow, testimonialsRes.data);

  return (
    <>
      <AdminHeader title="דף הבית" description="הכותרת והטקסטים של הבאנר נערכים בעמוד &quot;עיצוב ופרטי העסק&quot;." />

      <Panel title="באנר ראשי" description="עד 10 תמונות שמתחלפות, או סרטון אחד (MP4) שמתנגן ברקע. תמונה רחבה (לרוחב) נראית הכי טוב.">
        <MediaListEditor list="hero" items={media.hero} folder="hero" max={10} allowVideo />
      </Panel>

      <Panel title="פס תמונות עליון" description="נע מימין לשמאל. מומלצות תמונות תקריב לאורך (פורטרט).">
        <MediaListEditor list="stripTop" items={media.stripTop} folder="strips" max={30} />
      </Panel>

      <Panel title="פס תמונות תחתון" description="נע משמאל לימין.">
        <MediaListEditor list="stripBottom" items={media.stripBottom} folder="strips" max={30} />
      </Panel>

      <Panel title="המלצה חדשה">
        <AdminForm action={createTestimonial} submitLabel="הוספת המלצה" resetOnSuccess>
          <TestimonialFields idPrefix="new" />
        </AdminForm>
      </Panel>

      {testimonials.map((t) => (
        <Panel key={t.id} title={`המלצה של ${t.client_name}`} description={t.is_published ? undefined : "מוסתרת"}>
          <AdminForm action={updateTestimonial.bind(null, t.id)}>
            <TestimonialFields
              idPrefix={t.id}
              values={{
                clientName: t.client_name,
                eventLabel: t.event_label ?? "",
                content: t.content,
                rating: t.rating,
                sortOrder: t.sort_order,
                isPublished: t.is_published,
              }}
            />
          </AdminForm>
          <TestimonialDelete testimonialId={t.id} />
        </Panel>
      ))}
    </>
  );
}
