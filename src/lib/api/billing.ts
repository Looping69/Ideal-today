import { invokeAction } from "@/lib/api/client";
import type { HostPlan, PaymentSessionStatus } from "@/lib/api/types";

export const billingApi = {
  startBookingCheckout: (payload: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    successUrl: string;
    cancelUrl: string;
    failUrl: string;
  }) =>
    invokeAction<
      typeof payload,
      { paymentSessionId: string; bookingId: string; redirectUrl: string }
    >("billing-api", "startBookingCheckout", payload),

  startPlanCheckout: (payload: {
    planId: HostPlan;
    amount: number;
    successUrl: string;
    cancelUrl: string;
    failUrl: string;
  }) =>
    invokeAction<
      typeof payload,
      { paymentSessionId: string; redirectUrl: string }
    >("billing-api", "startPlanCheckout", payload),

  getSessionStatus: (payload: {
    paymentSessionId?: string;
    providerCheckoutId?: string;
    bookingId?: string;
  }) => invokeAction<typeof payload, PaymentSessionStatus>("billing-api", "getSessionStatus", payload),
};
