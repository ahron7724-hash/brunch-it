import "server-only";

/**
 * Payment adapter. Today orders are placed without charging ("none").
 * To add a provider later (Tranzila, Yaad, CreditGuard, Stripe…), implement PaymentProvider
 * and return it from getPaymentProvider(). The order flow and the database
 * (orders.payment_status / payment_provider / payment_reference) already support it.
 */

export type PaymentRequest = {
  orderId: string;
  orderNumber: number;
  amount: number;
  customer: { name: string; email: string; phone: string };
};

export type PaymentResult =
  | { kind: "none" } // no online payment; the business arranges payment directly
  | { kind: "redirect"; url: string; reference: string } // send the customer to the provider's page
  | { kind: "failed"; message: string };

export interface PaymentProvider {
  readonly name: string;
  /** Status the order is saved with before payment completes. */
  readonly initialStatus: "none" | "pending";
  start(request: PaymentRequest): Promise<PaymentResult>;
}

const noPayment: PaymentProvider = {
  name: "none",
  initialStatus: "none",
  async start() {
    return { kind: "none" };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // Future: switch on process.env.PAYMENT_PROVIDER.
  return noPayment;
}
