import { buildCorsHeaders, empty } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { assert, asIsoDate, isNonEmptyString } from "../_shared/validation.ts";
import { createYocoCheckout } from "../_shared/yoco.ts";

const HOST_PLAN_PRICES: Record<string, Record<string, number>> = {
  free: { monthly: 0, annual: 0 },
  standard: { monthly: 14900, annual: 149000 },
  professional: { monthly: 35000, annual: 350000 },
  premium: { monthly: 39900, annual: 399000 },
};

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
  });
}

function dayDiff(checkIn: Date, checkOut: Date) {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return empty(req);
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const { user } = await requireUser(req);
    const body = await req.json();
    const admin = createAdminClient();
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

    assert(isNonEmptyString(body?.kind), "Missing checkout kind");

    if (body.kind === "booking") {
      assert(isNonEmptyString(body.propertyId), "Missing propertyId");

      const checkIn = asIsoDate(body.checkIn);
      const checkOut = asIsoDate(body.checkOut);
      assert(checkIn && checkOut, "Invalid booking dates");
      assert(checkOut > checkIn, "Check-out must be after check-in");

      const nights = dayDiff(checkIn, checkOut);
      assert(nights > 0, "Booking must be at least one night");

      const { data: property, error: propertyError } = await admin
        .from("properties")
        .select("id, title, price, cleaning_fee, service_fee, approval_status, is_occupied")
        .eq("id", body.propertyId)
        .single();

      if (propertyError || !property) throw new Error("Property not found");
      assert(property.approval_status === "approved", "Property is not available for booking");
      assert(property.is_occupied !== true, "Property is currently unavailable");

      const { data: overlapping, error: overlapError } = await admin
        .from("bookings")
        .select("id")
        .eq("property_id", body.propertyId)
        .in("status", ["pending", "confirmed"])
        .lt("check_in", checkOut.toISOString())
        .gt("check_out", checkIn.toISOString());

      if (overlapError) throw overlapError;
      assert(!overlapping || overlapping.length === 0, "Property is no longer available for the selected dates");

      const totalAmount = Math.round(
        (Number(property.price) * nights + Number(property.cleaning_fee || 0) + Number(property.service_fee || 0)) * 100,
      );

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .insert({
          property_id: body.propertyId,
          user_id: user.id,
          check_in: checkIn.toISOString().slice(0, 10),
          check_out: checkOut.toISOString().slice(0, 10),
          total_price: totalAmount / 100,
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (bookingError || !booking) throw bookingError || new Error("Failed to create booking");

      const { data: session, error: sessionError } = await admin
        .from("payment_sessions")
        .insert({
          user_id: user.id,
          kind: "booking",
          target_booking_id: booking.id,
          amount_cents: totalAmount,
          currency: "ZAR",
          status: "pending",
        })
        .select("id")
        .single();

      if (sessionError || !session) throw sessionError || new Error("Failed to create payment session");

      const checkout = await createYocoCheckout(
        {
          amount: totalAmount,
          currency: "ZAR",
          successUrl: `${siteUrl}/book/success?bookingId=${booking.id}`,
          cancelUrl: `${siteUrl}/book?status=cancelled`,
          failureUrl: `${siteUrl}/book?status=failed`,
          externalId: session.id,
          clientReferenceId: booking.id,
          metadata: {
            type: "booking",
            bookingId: booking.id,
            paymentSessionId: session.id,
          },
        },
        session.id,
      );

      const { error: updateSessionError } = await admin
        .from("payment_sessions")
        .update({
          yoco_checkout_id: checkout.id,
          provider_response: checkout,
        })
        .eq("id", session.id);

      if (updateSessionError) throw updateSessionError;

      return json(req, { redirectUrl: checkout.redirectUrl, bookingId: booking.id });
    }

    if (body.kind === "host_plan") {
      assert(isNonEmptyString(body.planId), "Missing planId");
      assert(body.planId in HOST_PLAN_PRICES, "Unsupported plan");
      const billingInterval = body.billingInterval === "annual" ? "annual" : "monthly";
      const amount = HOST_PLAN_PRICES[body.planId][billingInterval];
      assert(amount > 0, "Free plan does not require checkout");

      const { data: session, error: sessionError } = await admin
        .from("payment_sessions")
        .insert({
          user_id: user.id,
          kind: "host_plan",
          target_plan: body.planId,
          target_plan_interval: billingInterval,
          amount_cents: amount,
          currency: "ZAR",
          status: "pending",
        })
        .select("id")
        .single();

      if (sessionError || !session) throw sessionError || new Error("Failed to create payment session");

      const checkout = await createYocoCheckout(
        {
          amount,
          currency: "ZAR",
          successUrl: `${siteUrl}/host/subscription?status=success`,
          cancelUrl: `${siteUrl}/host/subscription?status=cancelled`,
          failureUrl: `${siteUrl}/host/subscription?status=failed`,
          externalId: session.id,
          clientReferenceId: user.id,
          metadata: {
            type: "host_plan",
            planId: body.planId,
            billingInterval,
            paymentSessionId: session.id,
          },
        },
        session.id,
      );

      const { error: updateSessionError } = await admin
        .from("payment_sessions")
        .update({
          yoco_checkout_id: checkout.id,
          provider_response: checkout,
        })
        .eq("id", session.id);

      if (updateSessionError) throw updateSessionError;

      return json(req, { redirectUrl: checkout.redirectUrl });
    }

    return json(req, { error: "Unsupported checkout kind" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
