import { HttpError } from "./http.ts";

const YOCO_CHECKOUT_URL = "https://payments.yoco.com/api/checkouts";

export async function createYocoCheckout(payload: {
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  successUrl: string;
  cancelUrl: string;
  failUrl: string;
}) {
  const secretKey = Deno.env.get("YOCO_SECRET_KEY");
  if (!secretKey) {
    throw new HttpError(500, "Missing YOCO_SECRET_KEY");
  }

  const response = await fetch(YOCO_CHECKOUT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency,
      metadata: payload.metadata,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      failure_url: payload.failUrl,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.id || !data?.redirectUrl) {
    throw new HttpError(502, "Failed to create Yoco checkout", data);
  }

  return data as { id: string; redirectUrl: string };
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a[index] ^ b[index];
  }

  return mismatch === 0;
}

export async function verifyYocoWebhook(req: Request, rawBody: string) {
  const secret = Deno.env.get("YOCO_WEBHOOK_SECRET");
  if (!secret) {
    throw new HttpError(500, "Missing YOCO_WEBHOOK_SECRET");
  }

  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    throw new HttpError(401, "Missing webhook verification headers");
  }

  const timestampSeconds = Number(webhookTimestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > 180) {
    throw new HttpError(401, "Webhook timestamp outside accepted threshold");
  }

  const secretValue = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const secretBytes = Uint8Array.from(atob(secretValue), (char) => char.charCodeAt(0));
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signedContent),
  );

  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const provided = webhookSignature
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.split(",")[1])
    .filter(Boolean);

  const expectedBytes = new TextEncoder().encode(expected);
  const valid = provided.some((candidate) =>
    timingSafeEqual(expectedBytes, new TextEncoder().encode(candidate))
  );

  if (!valid) {
    throw new HttpError(401, "Invalid webhook signature");
  }
}
