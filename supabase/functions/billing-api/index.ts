import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { createYocoCheckout } from "../_shared/yoco.ts";
import { requireUser } from "../_shared/supabase.ts";

function withQueryParam(url: string, key: string, value: string) {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

function getNightCount(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) {
    throw new HttpError(400, "Check-out must be after check-in");
  }

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

async function startBookingCheckout(req: Request, payload: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  successUrl: string;
  cancelUrl: string;
  failUrl: string;
}) {
  const { user, adminClient } = await requireUser(req);
  const { data: property, error: propertyError } = await adminClient
    .from("properties")
    .select("id, price, cleaning_fee, service_fee, approval_status")
    .eq("id", payload.propertyId)
    .single();

  if (propertyError || !property || property.approval_status !== "approved") {
    throw new HttpError(404, "Property not available");
  }

  const nights = getNightCount(payload.checkIn, payload.checkOut);
  const totalPrice = Number(property.price) * nights + Number(property.cleaning_fee ?? 0) + Number(property.service_fee ?? 0);
  if (Number(payload.totalPrice) !== totalPrice) {
    throw new HttpError(409, "Booking total no longer matches current pricing");
  }

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .insert({
      property_id: payload.propertyId,
      user_id: user.id,
      check_in: payload.checkIn,
      check_out: payload.checkOut,
      total_price: totalPrice,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    throw new HttpError(500, "Failed to create pending booking", bookingError);
  }

  const { data: paymentSession, error: paymentSessionError } = await adminClient
    .from("payment_sessions")
    .insert({
      kind: "booking",
      user_id: user.id,
      booking_id: booking.id,
      amount: totalPrice,
      currency: "ZAR",
      status: "pending",
      metadata: {
        propertyId: payload.propertyId,
        guests: payload.guests,
      },
    })
    .select("id")
    .single();

  if (paymentSessionError || !paymentSession) {
    throw new HttpError(500, "Failed to create payment session", paymentSessionError);
  }

  const checkout = await createYocoCheckout({
    amount: totalPrice * 100,
    currency: "ZAR",
    metadata: {
      paymentSessionId: paymentSession.id,
      bookingId: booking.id,
    },
    successUrl: withQueryParam(payload.successUrl, "paymentSessionId", paymentSession.id),
    cancelUrl: withQueryParam(payload.cancelUrl, "paymentSessionId", paymentSession.id),
    failUrl: withQueryParam(payload.failUrl, "paymentSessionId", paymentSession.id),
  });

  const { error: updateError } = await adminClient
    .from("payment_sessions")
    .update({
      provider_checkout_id: checkout.id,
      metadata: {
        propertyId: payload.propertyId,
        guests: payload.guests,
        checkoutId: checkout.id,
      },
    })
    .eq("id", paymentSession.id);

  if (updateError) {
    throw new HttpError(500, "Failed to update payment session", updateError);
  }

  return {
    paymentSessionId: paymentSession.id,
    bookingId: booking.id,
    redirectUrl: checkout.redirectUrl,
  };
}

async function startPlanCheckout(req: Request, payload: {
  planId: "free" | "standard" | "premium";
  amount: number;
  successUrl: string;
  cancelUrl: string;
  failUrl: string;
}) {
  const { user, adminClient } = await requireUser(req);
  if (payload.planId === "free") {
    throw new HttpError(400, "Free plan upgrades do not require checkout");
  }

  const { data: paymentSession, error: paymentSessionError } = await adminClient
    .from("payment_sessions")
    .insert({
      kind: "host_plan",
      user_id: user.id,
      plan_id: payload.planId,
      amount: payload.amount,
      currency: "ZAR",
      status: "pending",
      metadata: {},
    })
    .select("id")
    .single();

  if (paymentSessionError || !paymentSession) {
    throw new HttpError(500, "Failed to create payment session", paymentSessionError);
  }

  const checkout = await createYocoCheckout({
    amount: payload.amount * 100,
    currency: "ZAR",
    metadata: {
      paymentSessionId: paymentSession.id,
      planId: payload.planId,
      userId: user.id,
    },
    successUrl: withQueryParam(payload.successUrl, "paymentSessionId", paymentSession.id),
    cancelUrl: withQueryParam(payload.cancelUrl, "paymentSessionId", paymentSession.id),
    failUrl: withQueryParam(payload.failUrl, "paymentSessionId", paymentSession.id),
  });

  const { error: updateError } = await adminClient
    .from("payment_sessions")
    .update({
      provider_checkout_id: checkout.id,
      metadata: {
        checkoutId: checkout.id,
      },
    })
    .eq("id", paymentSession.id);

  if (updateError) {
    throw new HttpError(500, "Failed to update payment session", updateError);
  }

  return {
    paymentSessionId: paymentSession.id,
    redirectUrl: checkout.redirectUrl,
  };
}

async function getSessionStatus(req: Request, payload: {
  paymentSessionId?: string;
  providerCheckoutId?: string;
  bookingId?: string;
}) {
  const { user, adminClient } = await requireUser(req);
  let query = adminClient
    .from("payment_sessions")
    .select(`
      *,
      booking:bookings(
        *,
        property:properties(id, title, location, image)
      )
    `)
    .eq("user_id", user.id);

  if (payload.paymentSessionId) {
    query = query.eq("id", payload.paymentSessionId);
  } else if (payload.providerCheckoutId) {
    query = query.eq("provider_checkout_id", payload.providerCheckoutId);
  } else if (payload.bookingId) {
    query = query.eq("booking_id", payload.bookingId);
  } else {
    throw new HttpError(400, "A payment session lookup key is required");
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).single();
  if (error || !data) {
    throw new HttpError(404, "Payment session not found");
  }

  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, payload } = await readActionBody(req);
    switch (action) {
      case "startBookingCheckout":
        return json(await startBookingCheckout(req, payload));
      case "startPlanCheckout":
        return json(await startPlanCheckout(req, payload));
      case "getSessionStatus":
        return json(await getSessionStatus(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
