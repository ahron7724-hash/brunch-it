import { BookingConfigProvider } from "@/components/booking/BookingConfigProvider/BookingConfigProvider";
import { PickupButton } from "@/components/booking/PickupButton/PickupButton";
import { PickupPicker } from "@/components/booking/PickupPicker/PickupPicker";
import { CartDrawer } from "@/components/cart/CartDrawer/CartDrawer";
import { Footer } from "@/components/sections/Footer/Footer";
import { Header } from "@/components/sections/Header/Header";
import { getBookingConfig } from "@/lib/data/booking";
import { getSettings } from "@/lib/settings/get-settings";

// The pickup calendar is built from "today", so shop pages are regenerated at least hourly.
// Admin changes trigger on-demand revalidation on top of this.
export const revalidate = 3600;

/** Shop frame: header, footer, pickup picker and cart. */
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, bookingConfig] = await Promise.all([getSettings(), getBookingConfig()]);

  return (
    <BookingConfigProvider config={bookingConfig}>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header settings={settings} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer settings={settings} />
      <PickupButton />
      <PickupPicker />
      <CartDrawer productsMinOrder={settings.productsMinOrder} />
    </BookingConfigProvider>
  );
}
