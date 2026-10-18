import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm/CheckoutForm";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { getDeliveryZones } from "@/lib/data/delivery";
import { getSettings } from "@/lib/settings/get-settings";

export const metadata: Metadata = {
  title: "השלמת הזמנה",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [settings, zones] = await Promise.all([getSettings(), getDeliveryZones()]);

  return (
    <>
      <PageIntro title="השלמת הזמנה" description="אין חיוב באתר. אחרי שליחת ההזמנה נחזור אליכם לאישור." />
      <CheckoutForm
        zones={settings.deliveryEnabled ? zones : []}
        pickupAddress={settings.pickupAddress}
        pickupMapUrl={settings.pickupMapUrl}
      />
    </>
  );
}
