import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireAdmin, requireUser } from "../_shared/supabase.ts";
import { assert, isNonEmptyString } from "../_shared/validation.ts";

const SOURCE_TYPES = new Set([
  "owned_media",
  "host_referral",
  "partner_referral",
  "guest_referral",
  "organic",
  "paid_media",
]);

const CREDIT_TYPES = new Set([
  "regional_feature",
  "homepage_boost",
  "holiday_spotlight",
  "content_launch_pack",
]);

const SOURCE_PRIORITY: Record<string, number> = {
  owned_media: 1,
  partner_referral: 2,
  host_referral: 3,
  guest_referral: 4,
  organic: 5,
  paid_media: 6,
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSourceType(value: unknown) {
  const normalized = normalizeText(value).toLowerCase();
  return SOURCE_TYPES.has(normalized) ? normalized : "";
}

function parseMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function canReplaceAttribution(existingType: string, nextType: string) {
  const existingPriority = SOURCE_PRIORITY[existingType] ?? Number.MAX_SAFE_INTEGER;
  const nextPriority = SOURCE_PRIORITY[nextType] ?? Number.MAX_SAFE_INTEGER;
  return nextPriority <= existingPriority;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return empty(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    assert(isNonEmptyString(body?.action), "Missing action");

    if (body.action === "capture-attribution") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      const sourceType = normalizeSourceType(body.sourceType);
      const sourceKey = normalizeText(body.sourceKey);
      const sourceLabel = normalizeText(body.sourceLabel) || null;
      const metadata = parseMetadata(body.metadata);

      assert(sourceType, "Invalid source type");
      assert(sourceKey, "Missing source key");

      const referrerProfileId = normalizeText(body.referrerProfileId) || null;
      const partnerProfileId = normalizeText(body.partnerProfileId) || null;
      const expiresAt = normalizeText(body.expiresAt) || null;

      const { data: existing, error: existingError } = await admin
        .from("referral_attributions")
        .select("id, user_id, source_type, source_key, source_label, metadata")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing && !canReplaceAttribution(existing.source_type, sourceType)) {
        return json(req, {
          attribution: existing,
          preserved: true,
          reason: "Existing attribution has higher precedence",
        });
      }

      const payload = {
        user_id: user.id,
        source_type: sourceType,
        source_key: sourceKey,
        source_label: sourceLabel,
        referrer_profile_id: referrerProfileId,
        partner_profile_id: partnerProfileId,
        expires_at: expiresAt,
        captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata,
      };

      const { data: attribution, error } = await admin
        .from("referral_attributions")
        .upsert(payload, { onConflict: "user_id" })
        .select("id, user_id, source_type, source_key, source_label, referrer_profile_id, partner_profile_id, captured_at, expires_at, metadata")
        .single();

      if (error || !attribution) throw error || new Error("Failed to capture attribution");
      return json(req, { attribution, preserved: false });
    }

    if (body.action === "get-my-attribution") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      const { data, error } = await admin
        .from("referral_attributions")
        .select("id, user_id, source_type, source_key, source_label, referrer_profile_id, partner_profile_id, captured_at, expires_at, metadata")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return json(req, { attribution: data ?? null });
    }

    if (body.action === "get-my-visibility-credits") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      const { data, error } = await admin
        .from("visibility_credits")
        .select("id, credit_type, quantity, source, expires_at, consumed_at, metadata, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json(req, { credits: data ?? [] });
    }

    if (body.action === "admin-grant-visibility-credit") {
      const { admin } = await requireAdmin(req);
      const profileId = normalizeText(body.profileId);
      const creditType = normalizeText(body.creditType);
      const source = normalizeText(body.source);
      const quantity = Number(body.quantity ?? 1);
      const expiresAt = normalizeText(body.expiresAt) || null;
      const metadata = parseMetadata(body.metadata);

      assert(profileId, "Missing profileId");
      assert(CREDIT_TYPES.has(creditType), "Invalid credit type");
      assert(source, "Missing source");
      assert(Number.isFinite(quantity) && quantity > 0, "Invalid quantity");

      const { data, error } = await admin
        .from("visibility_credits")
        .insert({
          profile_id: profileId,
          credit_type: creditType,
          quantity,
          source,
          expires_at: expiresAt,
          metadata,
        })
        .select("id, profile_id, credit_type, quantity, source, expires_at, consumed_at, metadata, created_at")
        .single();

      if (error || !data) throw error || new Error("Failed to grant visibility credit");
      return json(req, { credit: data });
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
