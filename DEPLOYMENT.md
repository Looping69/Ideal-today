# Deployment Guide

This app is not just a static Vite build anymore. Deployment now has two parts:

1. the frontend bundle
2. Supabase migrations, Edge Functions, and secrets

If you only deploy the frontend, the payment and admin flows will lie to you.

## 1. Frontend Deployment

Deploy the `dist` output to your preferred static host.

### Build

```bash
npm install
npm run build
```

### Required frontend env vars

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_KEY`
- `VITE_YOCO_PUBLIC_KEY`

## 2. Supabase Migration Rollout

Apply the migrations before deploying new frontend code that depends on them.

Key changes introduced by the API rescue work include:

- `payment_sessions`
- `profiles.verification_status`
- `profiles.verification_docs`
- `profiles.verification_submitted_at`
- private verification bucket policies
- removal of the public bookings read path

Use your normal Supabase migration workflow to push `supabase/migrations/*`.

## 3. Edge Function Deployment

Deploy the full API surface, not just the legacy helpers.

Required functions:

- `properties-api`
- `bookings-api`
- `billing-api`
- `host-api`
- `admin-api`
- `engagement-api`
- `yoco-webhook`
- `send-email`

Example:

```bash
npx supabase functions deploy properties-api
npx supabase functions deploy bookings-api
npx supabase functions deploy billing-api
npx supabase functions deploy host-api
npx supabase functions deploy admin-api
npx supabase functions deploy engagement-api
npx supabase functions deploy yoco-webhook --no-verify-jwt
npx supabase functions deploy send-email
```

`yoco-webhook` is intentionally deployed with `--no-verify-jwt` because the payment provider is the caller, not an authenticated browser session.

## 4. Supabase Secrets

Set the function secrets in Supabase before traffic hits the new flows.

Minimum set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOCO_SECRET_KEY`
- `YOCO_WEBHOOK_SECRET`
- `RESEND_API_KEY` if transactional email stays enabled

Example:

```bash
npx supabase secrets set YOCO_SECRET_KEY=...
npx supabase secrets set YOCO_WEBHOOK_SECRET=...
npx supabase secrets set RESEND_API_KEY=...
```

## 5. Auth and Redirect Configuration

Update Supabase Auth redirect URLs for your deployed frontend origin.

Make sure the payment flow return URLs resolve to the deployed app, for example:

- `/payment/success`
- `/payment/cancel`
- `/host/subscription`

The browser success pages are now status screens only. They expect the webhook to have confirmed the underlying `payment_sessions` row.

## 6. Yoco Webhook

Configure Yoco to call the deployed `yoco-webhook` endpoint.

That function is the only supported confirmer for:

- booking finalization
- host plan upgrades
- payment failure handling

If the webhook is not configured, bookings and plan upgrades should remain pending instead of silently self-confirming in the browser.

## 7. Post-Deploy Verification

Run these checks after deploy:

### Tooling

```bash
npm run lint
npm run build
```

### Functional smoke checks

- Anonymous users cannot read raw bookings.
- A guest checkout creates a pending booking plus a `payment_sessions` row.
- Visiting the success URL manually does not confirm a booking.
- A host plan checkout does not update `profiles.host_plan` until the webhook lands.
- Verification uploads go to user-scoped private paths.
- Admin review screens can open signed verification document URLs.

## 8. Known Operational Constraint

`src/types/supabase.ts` can only be regenerated with valid Supabase CLI auth for the linked project. If `npm run types:supabase` returns `Unauthorized`, fix CLI auth instead of pretending the generated types are current.
