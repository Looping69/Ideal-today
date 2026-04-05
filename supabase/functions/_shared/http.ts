export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ error: error.message, details: error.details }), {
      status: error.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  console.error("Unhandled edge function error", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export async function readActionBody<TPayload>(req: Request): Promise<{ action: string; payload: TPayload }> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    throw new HttpError(400, "Invalid request body");
  }

  return {
    action: body.action,
    payload: (body.payload ?? {}) as TPayload,
  };
}
