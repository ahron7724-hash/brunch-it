import type { PricedLine } from "@/lib/orders/priceOrder";

export type OrderSummary = {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string | null;
  pickupDate: string;
  slotStart: string;
  slotEnd: string;
  fulfillment: "pickup" | "delivery";
  deliveryZoneName: string | null;
  deliveryAddress: string | null;
  deliveryFee: number;
  total: number;
  lines: PricedLine[];
};
