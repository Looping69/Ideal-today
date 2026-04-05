import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, HttpError } from "../_shared/http.ts";
import { verifyYocoWebhook } from "../_shared/yoco.ts";

type YocoEvent = {
  id: string;
  type: "payment.succeeded" | "payment.failed" | string;
  payload?: {
    status?: string;
    metadata?: {
      checkoutId?: string;
    };
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const rawBody = await req.text();
    await verifyYocoWebhook(req, rawBody);
    const event = JSON.parse(rawBody) as YocoEvent;
    const checkoutId = event.payload?.metadata?.checkoutId;

    if (!checkoutId) {
      throw new HttpError(400, "Missing checkoutId in webhook payload");
    }

    const adminClient = createServiceClient();
    const { data: session, error: sessionError } = await adminClient
      .from("payment_sessions")
      .select("*")
      .eq("provider_checkout_id", checkoutId)
      .maybeSingle();

    if (sessionError) {
      throw new HttpError(500, "Failed to load payment session", sessionError);
    }

    if (!session) {
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
    }

    if (event.type === "payment.succeeded" && session.status !== "succeeded") {
      const { error: sessionUpdateError } = await adminClient
        .from("payment_sessions")
        .update({
          status: "succeeded",
          confirmed_at: new Date().toISOString(),
          metadata: {
            ...(session.metadata ?? {}),
            lastEventId: event.id,
            lastEventType: event.type,
          },
        })
        .eq("id", session.id);

      if (sessionUpdateError) {
        throw new HttpError(500, "Failed to confirm payment session", sessionUpdateError);
      }

      if (session.kind === "booking" && session.booking_id) {
        const { error: bookingError } = await adminClient
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", session.booking_id)
          .neq("status", "confirmed");

        if (bookingError) {
          throw new HttpError(500, "Failed to confirm booking", bookingError);
        }
      }

      if (session.kind === "host_plan" && session.plan_id) {
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({ host_plan: session.plan_id })
          .eq("id", session.user_id)
          .neq("host_plan", session.plan_id);

        if (profileError) {
          throw new HttpError(500, "Failed to apply host plan upgrade", profileError);
        }
      }
    }

    if (event.type === "payment.failed" && session.status !== "failed") {
      const { error: sessionUpdateError } = await adminClient
        .from("payment_sessions")
        .update({
          status: "failed",
          metadata: {
            ...(session.metadata ?? {}),
            lastEventId: event.id,
            lastEventType: event.type,
          },
        })
        .eq("id", session.id);

      if (sessionUpdateError) {
        throw new HttpError(500, "Failed to update failed payment session", sessionUpdateError);
      }

      if (session.kind === "booking" && session.booking_id) {
        await adminClient
          .from("bookings")
          .update({ status: "canceled" })
          .eq("id", session.booking_id)
          .eq("status", "pending");
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});
