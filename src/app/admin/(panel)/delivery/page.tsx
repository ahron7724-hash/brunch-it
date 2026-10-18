import { z } from "zod";

import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { DeliveryZonesEditor } from "@/components/admin/DeliveryZonesEditor/DeliveryZonesEditor";
import { Panel } from "@/components/admin/Panel/Panel";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { getSettings } from "@/lib/settings/get-settings";
import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

import { saveDeliveryEnabled } from "./actions";

export default async function DeliveryPage() {
  const supabase = await createClient();
  const [settings, zonesRes] = await Promise.all([getSettings(), supabase.from("delivery_zones").select("id, name, price, min_order").order("sort_order")]);
  const zones = parseRows(z.object({ id: z.string().uuid(), name: z.string(), price: z.coerce.number(), min_order: z.coerce.number() }), zonesRes.data);

  return (
    <>
      <AdminHeader title="משלוחים" description="אזורי משלוח, מחיר לכל אזור ומינימום הזמנה." />

      <Panel title="הפעלת משלוחים">
        <AdminForm action={saveDeliveryEnabled}>
          <Checkbox id="deliveryEnabled" name="deliveryEnabled" label="לאפשר משלוח בקופה" defaultChecked={settings.deliveryEnabled} />
        </AdminForm>
      </Panel>

      <Panel title="אזורי משלוח" description="הלקוח בוחר אזור בקופה, ודמי המשלוח מתווספים לסכום. מינימום 0 = ללא מינימום.">
        <DeliveryZonesEditor
          zones={zones.map((z) => ({ id: z.id, name: z.name, price: String(z.price), minOrder: String(z.min_order) }))}
        />
      </Panel>
    </>
  );
}
