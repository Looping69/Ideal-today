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

async function upsertReward(
  admin: ReturnType<typeof createAdminClient>,
  reward: Record<string, unknown>,
) {
  const { error } = await admin
    .from("referral_rewards")
    .upsert(reward, { onConflict: "reward_key" });

  if (error) throw error;
}

async function upsertVisibilityCredit(
  admin: ReturnType<typeof createAdminClient>,
  credit: Record<string, unknown>,
) {
  const { error } = await admin
    .from("visibility_credits")
    .upsert(credit, { onConflict: "reward_key" });

  if (error) throw error;
}

async function issueHostActivationRewards(
  admin: ReturnType<typeof createAdminClient>,
  session: { id: string; user_id: string; target_plan: string; target_plan_interval: string | null },
) {
  const completedAt = new Date().toISOString();

  const { data: attribution } = await admin
    .from("referral_attributions")
    .select("id, source_type, source_key, source_label")
    .eq("user_id", session.user_id)
    .maybeSingle();

  if (attribution?.source_type === "owned_media") {
    const stage = session.target_plan_interval === "annual" ? "annual_upgrade" : "activation";
    const rewardKey = `owned-media-${stage}-${session.id}`;

    await upsertReward(admin, {
      beneficiary_profile_id: session.user_id,
      attribution_id: attribution.id,
      reward_type: "visibility_credit",
      reward_stage: stage,
      status: "approved",
      metadata: {
        sourceKey: attribution.source_key,
        sourceLabel: attribution.source_label,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      approved_at: completedAt,
      reward_key: rewardKey,
    });

    await upsertVisibilityCredit(admin, {
      profile_id: session.user_id,
      credit_type: session.target_plan_interval === "annual" ? "holiday_spotlight" : "regional_feature",
      quantity: 1,
      source: `owned_media:${attribution.source_key}`,
      metadata: {
        sourceLabel: attribution.source_label,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      reward_key: rewardKey,
    });
  }

  const { data: hostReferral } = await admin
    .from("host_referrals")
    .select("id, referrer_id, status")
    .eq("referee_id", session.user_id)
    .maybeSingle();

  if (hostReferral?.referrer_id) {
    const rewardKey = `host-referrer-activation-${session.id}`;
    const referredHostRewardKey = `host-referee-activation-${session.id}`;

    await admin
      .from("host_referrals")
      .update({
        status: "rewarded",
        rewarded_at: completedAt,
      })
      .eq("id", hostReferral.id)
      .neq("status", "rewarded");

    await upsertReward(admin, {
      beneficiary_profile_id: hostReferral.referrer_id,
      attribution_id: attribution?.id ?? null,
      reward_type: "visibility_credit",
      reward_stage: "activation",
      status: "approved",
      metadata: {
        referredHostId: session.user_id,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      approved_at: completedAt,
      reward_key: rewardKey,
    });

    await upsertVisibilityCredit(admin, {
      profile_id: hostReferral.referrer_id,
      credit_type: "regional_feature",
      quantity: session.target_plan_interval === "annual" ? 2 : 1,
      source: "host_referral_activation",
      metadata: {
        referredHostId: session.user_id,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      reward_key: rewardKey,
    });

    await upsertReward(admin, {
      beneficiary_profile_id: session.user_id,
      attribution_id: attribution?.id ?? null,
      reward_type: "content_pack",
      reward_stage: session.target_plan_interval === "annual" ? "annual_upgrade" : "activation",
      status: "approved",
      metadata: {
        referrerId: hostReferral.referrer_id,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      approved_at: completedAt,
      reward_key: referredHostRewardKey,
    });

    await upsertVisibilityCredit(admin, {
      profile_id: session.user_id,
      credit_type: "content_launch_pack",
      quantity: 1,
      source: "host_referral_activation",
      metadata: {
        referrerId: hostReferral.referrer_id,
        planId: session.target_plan,
        billingInterval: session.target_plan_interval ?? "monthly",
      },
      reward_key: referredHostRewardKey,
    });
  }
}

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

        await issueHostActivationRewards(admin, session);
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
