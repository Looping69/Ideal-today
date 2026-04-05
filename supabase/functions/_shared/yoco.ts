const YOCO_API_URL = "https://payments.yoco.com/api/checkouts";

function getYocoSecretKey() {
  const value = Deno.env.get("YOCO_SECRET_KEY");
  if (!value) throw new Error("Missing YOCO_SECRET_KEY");
  if (!value.startsWith("sk_")) throw new Error("YOCO_SECRET_KEY must be a secret key");
  return value;
}

function decodeWebhookSecret(secret: string) {
  const encoded = secret.split("_")[1];
  if (!encoded) throw new Error("Invalid YOCO_WEBHOOK_SECRET format");
  const decoded = atob(encoded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createYocoCheckout(payload: Record<string, unknown>, idempotencyKey: string) {
  const response = await fetch(YOCO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getYocoSecretKey()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || "Failed to create Yoco checkout");
  }

  return body;
}

export async function verifyYocoWebhook(rawBody: string, req: Request) {
  const webhookSecret = Deno.env.get("YOCO_WEBHOOK_SECRET");
  if (!webhookSecret) throw new Error("Missing YOCO_WEBHOOK_SECRET");

  const webhookId = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signatureHeader = req.headers.get("webhook-signature");

  if (!webhookId || !timestamp || !signatureHeader) {
    throw new Error("Missing webhook verification headers");
  }

  const ageSeconds = Math.abs(Date.now() - Number(timestamp) * 1000) / 1000;
  if (!Number.isFinite(ageSeconds) || ageSeconds > 180) {
    throw new Error("Webhook timestamp is outside the accepted window");
  }

  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
  const secretKey = await crypto.subtle.importKey(
    "raw",
    decodeWebhookSecret(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", secretKey, new TextEncoder().encode(signedContent));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const actual = signatureHeader
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(",")[1] ?? "")
    .find((entry) => Boolean(entry));

  if (!actual || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid webhook signature");
  }
}
