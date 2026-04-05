import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { invokeReferralAction } from "@/lib/backend";

type SourceType =
  | "owned_media"
  | "host_referral"
  | "partner_referral"
  | "guest_referral"
  | "organic"
  | "paid_media";

type PendingAttribution = {
  sourceType: SourceType;
  sourceKey: string;
  sourceLabel?: string;
  referrerProfileId?: string;
  partnerProfileId?: string;
  metadata?: Record<string, unknown>;
};

const STORAGE_KEYS = {
  guestCode: "referral_code",
  hostCode: "host_referral_code",
  payload: "pending_attribution",
  syncedUser: "pending_attribution_synced_user_id",
} as const;

function normalizeSourceType(value: string | null): SourceType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "owned_media" ||
    normalized === "host_referral" ||
    normalized === "partner_referral" ||
    normalized === "guest_referral" ||
    normalized === "organic" ||
    normalized === "paid_media"
  ) {
    return normalized;
  }
  return null;
}

function readPendingAttribution() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.payload);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingAttribution;
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.payload);
    return null;
  }
}

function buildPendingAttribution(search: string): PendingAttribution | null {
  const params = new URLSearchParams(search);
  const ref = params.get("ref");
  const hostRef = params.get("host_ref");
  const partner = params.get("partner");
  const sourceTypeParam = normalizeSourceType(params.get("source_type") || params.get("src") || params.get("source"));
  const sourceKey = params.get("source_key") || params.get("group") || params.get("campaign");
  const region = params.get("region");
  const sourceLabel = params.get("source_label") || params.get("group_name") || region || undefined;

  if (ref) {
    sessionStorage.setItem(STORAGE_KEYS.guestCode, ref);
  }

  if (hostRef) {
    sessionStorage.setItem(STORAGE_KEYS.hostCode, hostRef);
  }

  if (sourceTypeParam && sourceKey) {
    return {
      sourceType: sourceTypeParam,
      sourceKey,
      sourceLabel,
      metadata: {
        ref,
        hostRef,
        partner,
        region,
      },
    };
  }

  if (partner) {
    return {
      sourceType: "partner_referral",
      sourceKey: partner,
      sourceLabel: sourceLabel || partner,
      metadata: {
        ref,
        hostRef,
        region,
      },
    };
  }

  if (hostRef) {
    return {
      sourceType: "host_referral",
      sourceKey: hostRef,
      sourceLabel: sourceLabel || "Host referral",
      metadata: {
        ref,
        region,
      },
    };
  }

  if (ref) {
    return {
      sourceType: "guest_referral",
      sourceKey: ref,
      sourceLabel: sourceLabel || "Guest referral",
      metadata: {
        region,
      },
    };
  }

  return null;
}

export default function ReferralTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const pending = buildPendingAttribution(location.search);
    if (!pending) return;

    sessionStorage.setItem(STORAGE_KEYS.payload, JSON.stringify(pending));
    sessionStorage.removeItem(STORAGE_KEYS.syncedUser);
  }, [location.search]);

  useEffect(() => {
    if (!user) return;

    const pending = readPendingAttribution();
    if (!pending?.sourceKey) return;

    const syncedUserId = sessionStorage.getItem(STORAGE_KEYS.syncedUser);
    if (syncedUserId === user.id) return;

    let cancelled = false;

    void invokeReferralAction({
      action: "capture-attribution",
      sourceType: pending.sourceType,
      sourceKey: pending.sourceKey,
      sourceLabel: pending.sourceLabel,
      referrerProfileId: pending.referrerProfileId,
      partnerProfileId: pending.partnerProfileId,
      metadata: pending.metadata,
    })
      .then(() => {
        if (cancelled) return;
        sessionStorage.setItem(STORAGE_KEYS.syncedUser, user.id);
      })
      .catch((error) => {
        console.error("Failed to capture attribution", error);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
