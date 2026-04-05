# Ideal Today

Ideal Today is a Vite + React marketplace app backed by Supabase Auth, Postgres, Storage, and Edge Functions.

The codebase now follows a hybrid model:

- Direct client Supabase access is limited to auth/session handling and safe public reads.
- Sensitive reads and all business mutations flow through Supabase Edge Functions.
- Payments and host-plan upgrades are confirmed server-side through webhook-backed `payment_sessions`, not from browser redirects.

## Architecture

### Frontend

- `src/components/*`: product UI
- `src/contexts/*`: auth and app context
- `src/lib/api/*`: typed browser wrappers over Edge Functions
- `src/lib/supabase.ts`: browser Supabase client

### Backend

- `supabase/migrations/*`: database schema and policy source of truth
- `supabase/functions/properties-api`: public property reads, host listing CRUD, admin listing moderation
- `supabase/functions/bookings-api`: guest/host booking flows, blocked dates, messaging
- `supabase/functions/billing-api`: checkout session creation and payment session status
- `supabase/functions/host-api`: host profile, dashboard, verification, signed upload URLs
- `supabase/functions/admin-api`: admin dashboards, moderation, notifications, referrals, rewards, settings
- `supabase/functions/engagement-api`: wishlists, reviews, rewards dashboard, reward claims, referrals
- `supabase/functions/yoco-webhook`: verified payment confirmation and idempotent booking/plan finalization

## Security Direction

This repo was previously trusting the browser with things it had no business deciding. The current rescue work moves authority back to the server:

- The public `bookings` read policy is removed.
- Availability is exposed through `properties-api`, not raw table reads.
- Host verification documents live in a private bucket and are accessed via signed URLs.
- Host plan upgrades and booking confirmation are driven by webhook-confirmed `payment_sessions`.
- Admin notifications and moderation actions now go through admin-only APIs.

## Local Development

### Prerequisites

- Node 20+
- npm
- Supabase project access if you need to deploy functions or regenerate DB types

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

### Quality checks

```bash
npm run lint
npm run build
```

## Environment

The frontend expects the usual Vite env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_KEY`
- `VITE_YOCO_PUBLIC_KEY`

Supabase Edge Functions also require project secrets such as:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOCO_SECRET_KEY`
- `YOCO_WEBHOOK_SECRET`
- `RESEND_API_KEY` if email delivery is enabled

## Supabase Types

`src/types/supabase.ts` is now a checked-in fallback, not the source of truth.

To regenerate real types for the linked project, you need Supabase CLI auth and the project ref:

```bash
npm run types:supabase
```

If that command returns `Unauthorized`, authenticate the Supabase CLI first. Do not hand-edit DB truth into random app files.

## Migration Policy

- Database truth lives in `supabase/migrations`.
- `src/lib/setup_sql.ts` is diagnostic-only and should not become a shadow migration system again.
- Risky schema changes should stay additive and backfillable.

## Current Status

The highest-risk client-side mutation flows have been moved behind APIs, but this is still a live refactor, not a finished platform rewrite. Before pushing to production, make sure:

- the new migrations are applied
- all new Edge Functions are deployed
- Yoco webhook secrets are configured
- payment success/cancel URLs point to the deployed frontend
