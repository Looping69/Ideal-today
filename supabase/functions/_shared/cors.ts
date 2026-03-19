const DEFAULT_ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";
const DEFAULT_ALLOWED_METHODS = "POST, OPTIONS";

function configuredOrigins() {
  return [
    Deno.env.get("SITE_URL"),
    Deno.env.get("APP_URL"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter((value): value is string => Boolean(value));
}

export function resolveCorsOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return configuredOrigins()[0] ?? null;
  return configuredOrigins().includes(origin) ? origin : null;
}

export function buildCorsHeaders(req: Request, extraHeaders: HeadersInit = {}) {
  const origin = resolveCorsOrigin(req);
  const headers = new Headers(extraHeaders);

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Headers", DEFAULT_ALLOWED_HEADERS);
  headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS);

  return headers;
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
  });
}

export function empty(req: Request, status = 204) {
  return new Response(null, { status, headers: buildCorsHeaders(req) });
}
