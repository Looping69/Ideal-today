# Ideal Stay

Holiday accommodation marketplace built with:

- `Vite + React + TypeScript` for the frontend
- `Supabase` for auth, database, storage, realtime, and Edge Functions
- `Yoco` for checkout and payment webhooks
- `Gemini` behind server-side content generation endpoints

## Backend Shape

The frontend is not trusted with privileged writes.

Canonical backend entrypoints live in:

- `supabase/functions/create-checkout`
- `supabase/functions/yoco-webhook`
- `supabase/functions/admin-users`
- `supabase/functions/properties-api`
- `supabase/functions/user-profile`
- `supabase/functions/booking-actions`
- `supabase/functions/engagement-actions`
- `supabase/functions/content-engine`

Client wrappers for those functions live in:

- `src/lib/backend.ts`
- `src/lib/ai.ts`

## Content System

The content engine is now a first-class part of the main repo.

Canonical content files:

- `supabase/functions/content-engine/index.ts`
- `supabase/functions/_shared/content.ts`

Supported content scope is intentionally narrow:

- holiday accommodation assistant chat
- listing social post generation
- listing quality audits

The old Encore-based `contentengine/` backend has been retired and is not a deploy target.

## Setup

1. Install app dependencies:
   `npm install`
2. Run the frontend locally:
   `npm run dev`
3. Apply database changes:
   `supabase db push`
4. Deploy edge functions after secrets are set:
   `supabase functions deploy create-checkout yoco-webhook admin-users properties-api user-profile booking-actions engagement-actions content-engine host-verification send-email`

Required Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOCO_SECRET_KEY`
- `YOCO_WEBHOOK_SECRET`
- `GEMINI_API_KEY`

Optional content tuning:

- `GEMINI_MODEL`

## Payment Flow

- Checkout sessions are created by `create-checkout`
- Payment confirmation is finalized by `yoco-webhook`
- The frontend never confirms bookings or upgrades on its own

## Verify

- `npx tsc --noEmit`
- `npx vite build`
- `deno check supabase/functions/content-engine/index.ts`
- `deno check supabase/functions/booking-actions/index.ts`
- `deno check supabase/functions/engagement-actions/index.ts`
- 1
