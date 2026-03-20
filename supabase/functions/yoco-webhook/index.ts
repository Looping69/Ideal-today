import { createAdminClient } from "../_shared/supabase.ts";
import { verifyYocoWebhook } from "../_shared/yoco.ts";

type YocoEvent = {
  id: string;
  type: string;
  payload?: {
    id?: string;
    metadata?: {
      checkoutId?: string;
    };
  };
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    await verifyYocoWebhook(rawBody, req);

    const event = JSON.parse(rawBody) as YocoEvent;
    const checkoutId = event.payload?.metadata?.checkoutId;
    if (!checkoutId) {
      return new Response("Missing checkoutId", { status: 200 });
    }

    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("payment_sessions")
      .select("id, kind, user_id, target_booking_id, target_plan, target_plan_interval, yoco_event_id")
      .eq("yoco_checkout_id", checkoutId)
      .single();

    if (sessionError || !session) {
      return new Response("Unknown checkout", { status: 200 });
    }

    if (session.yoco_event_id === event.id) {
      return new Response("Already processed", { status: 200 });
    }

    if (event.type === "payment.succeeded") {
      await admin
        .from("payment_sessions")
        .update({
          status: "completed",
          yoco_event_id: event.id,
          provider_payment_id: event.payload?.id ?? null,
          provider_response: event,
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (session.kind === "booking" && session.target_booking_id) {
        await admin
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", session.target_booking_id);
      }

      if (session.kind === "host_plan" && session.target_plan) {
        const completedAt = new Date().toISOString();
        const annualExpiry =
          session.target_plan_interval === "annual"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await admin
          .from("profiles")
          .update({
            host_plan: session.target_plan,
            host_plan_interval: session.target_plan_interval ?? "monthly",
            host_plan_started_at: completedAt,
            host_plan_expires_at: annualExpiry,
          })
          .eq("id", session.user_id);
      }

      return new Response("ok", { status: 200 });
    }

    if (event.type === "payment.failed") {
      await admin
        .from("payment_sessions")
        .update({
          status: "failed",
          yoco_event_id: event.id,
          provider_payment_id: event.payload?.id ?? null,
          provider_response: event,
        })
        .eq("id", session.id);

      if (session.kind === "booking" && session.target_booking_id) {
        await admin
          .from("bookings")
          .update({ payment_status: "failed" })
          .eq("id", session.target_booking_id);
      }

      return new Response("ok", { status: 200 });
    }

    await admin
      .from("payment_sessions")
      .update({
        yoco_event_id: event.id,
        provider_response: event,
      })
      .eq("id", session.id);

    return new Response("ignored", { status: 200 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Webhook processing failed", { status: 400 });
  }
});
