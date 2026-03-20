# Media-First Referral Growth Plan

## Objective

Turn Ideal Stay's owned social distribution into a direct host-acquisition and monetization engine, then layer referral on top as an amplifier instead of treating referral as the primary growth mechanic.

This plan replaces the current points-heavy, revenue-share-heavy referral shape with a simpler system built around:

- owned media acquisition
- qualified host activation
- visibility inventory as a reward currency
- invite-only partner referrals for net-new reach

## Why We Are Changing This

The current system is pointing in multiple directions at once.

- `src/components/host/HostReferrals.tsx` sells long-tail revenue share and points.
- `src/components/rewards/RewardsDashboard.tsx` still centers points, badges, and challenge logic.
- `src/components/host/PricingPage.tsx` already wants to be a serious host growth offer with content and social distribution.
- `src/components/host/HostContentStudio.tsx` gives us a strong non-cash acquisition and retention perk.
- The referral schema and triggers in `supabase/migrations/20251129050000_host_referrals.sql`, `supabase/migrations/20260217000000_upgrade_referrals.sql`, and `supabase/migrations/20260219000000_update_referral_tiers.sql` are hard-wired to old assumptions: first-listing points, tiered revenue share, and open-ended commission logic.

That old model creates three problems:

1. It is economically fuzzy.
2. It pays for behavior that may not create strong revenue quickly enough.
3. It underuses the most valuable thing we actually own: attention.

## North Star

The core business event for this system is:

`Activated Paying Host`

A host counts as activated only when all of the following are true:

- they were attributed to a valid source
- they published an approved listing
- they either paid for a host plan or completed a first qualified booking

Everything else is secondary:

- signups are not success
- codes are not success
- clicks are not success
- points are not success

## Strategic Shape

### 1. Owned Media Comes First

The groups and page are our cheapest and strongest acquisition channel.

The first growth loop should be:

1. regional audience sees a host acquisition offer
2. host signs up through a region-specific landing page
3. host gets an onboarding offer with visible value
4. host activates and upgrades
5. host is later invited to refer or partner

### 2. Referral Becomes a Layer, Not the Foundation

Referral should only pay when it adds real value:

- brings in net-new hosts
- speeds up activation
- expands into regions or audiences our owned media is not already covering

### 3. Visibility Inventory Becomes Reward Currency

We own media inventory. That means we can reward hosts with things that feel valuable but cost less cash than direct payouts:

- featured regional posts
- priority listing placement
- seasonal spotlight slots
- content launch packs
- premium visibility credits

Cash should be used carefully for:

- approved external partners
- higher-value host referrals
- annual-plan activations

## Target Programs

### Program A: Owned Media Host Acquisition

This is not technically "referral." It is the primary acquisition system.

Offer shape:

- free plan or discounted first paid month
- free content launch pack for first listing
- optional annual-plan discount for immediate commitment
- region-specific trust and distribution messaging

Landing pages must be regional:

- Durban
- Cape Town
- Margate
- Umhlanga
- Mpumalanga
- Garden Route
- and other priority supply regions

### Program B: Host Ambassador Program

This is the public host referral layer, but it should be simple.

Reward shape:

- referred host gets immediate value:
  - discounted first paid month or stronger annual deal
  - free content launch pack
  - possible priority verification or setup support
- referrer gets:
  - visibility credit or featured placement
  - optional small cash or account credit after qualified activation
  - second reward only after retention or first booking

Qualification should be event-based, not signup-based.

### Program C: Invite-Only Partner Program

This is where tiers belong.

Partner types:

- photographers
- co-hosts
- local property marketers
- estate agents with holiday stock
- cleaners and guest-service operators
- travel creators
- travel page operators

Partner rewards can be stronger because they are expected to bring net-new supply:

- fixed bounty for activated host
- optional recurring share for a limited period
- co-marketing benefits
- higher-tier payouts based on qualified volume

This must remain single-level. No MLM-style tree.

### Program D: Guest Referral

Guest referral should exist, but it is not the primary monetization driver right now.

Guest offer should be simple:

- give booking credit
- get booking credit after the first completed stay

Points and badges can survive as cosmetic loyalty flavor, but not as the main economic engine.

## Data Model Changes

We should stop growing the old referral schema and introduce a clearer structure.

### Keep

- `profiles.referral_code`
- `profiles.host_referral_code`
- existing referral rows where they are needed for historical continuity

### Add

#### `referral_attributions`

Purpose:

- record source of acquisition
- prevent paying referral for traffic already owned by our media

Suggested fields:

- `id`
- `user_id`
- `source_type` (`owned_media`, `host_referral`, `partner_referral`, `guest_referral`, `organic`, `paid_media`)
- `source_key` (group slug, partner code, host code, campaign id)
- `source_label`
- `referrer_profile_id` nullable
- `partner_profile_id` nullable
- `captured_at`
- `expires_at`
- `metadata jsonb`

#### `referral_rewards`

Purpose:

- make payouts and credits explicit

Suggested fields:

- `id`
- `beneficiary_profile_id`
- `attribution_id`
- `reward_type` (`cash`, `account_credit`, `visibility_credit`, `content_pack`, `plan_discount`)
- `reward_stage` (`activation`, `retention`, `first_booking`, `annual_upgrade`)
- `status` (`pending`, `approved`, `paid`, `voided`, `consumed`)
- `amount`
- `currency`
- `metadata jsonb`
- `created_at`
- `approved_at`
- `paid_at`

#### `visibility_credits`

Purpose:

- allow owned media inventory to act as platform currency

Suggested fields:

- `id`
- `profile_id`
- `credit_type` (`regional_feature`, `homepage_boost`, `holiday_spotlight`, `content_launch_pack`)
- `quantity`
- `source`
- `expires_at`
- `created_at`

#### `partner_profiles`

Purpose:

- separate approved partner logic from normal host referral logic

Suggested fields:

- `profile_id`
- `status` (`pending`, `approved`, `suspended`)
- `tier` (`partner`, `pro_partner`, `market_lead`)
- `region_focus`
- `commission_model`
- `payout_details jsonb`
- `created_at`

## Attribution Rules

This is critical.

We cannot pay referral rewards for users that were already sourced by our own groups or pages unless the referral materially changed the outcome.

Default precedence:

1. `owned_media`
2. `partner_referral`
3. `host_referral`
4. `guest_referral`
5. `organic`

Recommended rule:

- if a user arrives through owned media and later enters a referral code, that code should not automatically override house attribution
- at most, that referral can earn an assist-style reward if we intentionally support that model later

Without this rule, we will end up paying commissions on traffic we already own.

## Product Changes

### Host Dashboard

`src/components/host/HostDashboard.tsx`

Replace the current "Refer-a-Host" points promo with a more credible acquisition and ambassador surface.

New message direction:

- grow your reach
- unlock visibility credits
- invite quality hosts once your own listing is live and earning

### Host Referrals Page

`src/components/host/HostReferrals.tsx`

Refactor completely.

Remove:

- founder/pro/standard public framing
- public revenue-share percentages
- points-first language

Replace with:

- simple qualified-host reward system
- visibility credits as first-class rewards
- clear status stages:
  - clicked
  - signed up
  - published listing
  - activated
  - retained

### Pricing Page

`src/components/host/PricingPage.tsx`

Add:

- annual plan option
- explicit "distribution + content" framing
- region-based media visibility offer
- acquisition promo support for owned-media campaigns

### Content Studio

`src/components/host/HostContentStudio.tsx`

Use this as:

- acquisition perk
- activation perk
- referral reward fulfillment surface

The content engine should help explain why a referred host should care now, not later.

### Guest Rewards

`src/components/rewards/RewardsDashboard.tsx`

Simplify.

Keep:

- basic loyalty and referral history

Reduce or remove:

- overbuilt gamification as the primary message

## Backend Changes

### New Edge Function Responsibilities

We can either extend `engagement-actions` or split a dedicated referral function. The cleaner path is a dedicated boundary:

- `supabase/functions/referral-actions/index.ts`

Primary actions:

- create attribution from landing page source
- claim or validate referral code
- issue reward on activation
- issue reward on retention
- create visibility credit
- approve or void partner payouts

### Event Triggers

We should stop relying on old trigger logic that pays points on first listing and commissions on booking fee percentages.

Replace with explicit backend event handlers driven by:

- signup captured
- first approved listing created
- host plan payment completed
- first qualified booking completed
- 90-day retention checkpoint

### Payment Qualification

The fastest cash path is annual plans.

We should update checkout logic so annual host-plan purchases can be distinguished from monthly upgrades and can trigger different referral or acquisition rewards.

## Rollout Phases

### Phase 1: Foundation Cleanup

- freeze new work on old referral percentages
- stop extending points logic
- add attribution and reward tables
- define reward statuses and qualification stages
- add annual-plan support

### Phase 2: Owned Media Funnel

- add regional landing pages
- capture source attribution from group/page links
- create host acquisition offer with content launch pack
- add activation tracking

### Phase 3: Host Ambassador Program

- refactor host referral UI
- replace points-first logic with qualified activation rewards
- issue visibility credits and account credits

### Phase 4: Partner Program

- add partner application and approval workflow
- add partner-specific codes and landing pages
- add tier upgrades based on qualified volume

### Phase 5: Guest Referral Simplification

- reduce noise in rewards dashboard
- keep simple double-sided guest referral

## Success Metrics

Primary:

- activated paying hosts by source
- cost per activated paying host
- annual-plan conversion rate
- first-booking rate after signup
- time-to-activation

Secondary:

- number of visibility credits issued and consumed
- partner-sourced host activation rate
- owned-media conversion rate by region
- content-launch-pack usage and conversion lift

## Things We Should Not Do

- do not build a public MLM-looking rank tree
- do not pay for raw signups
- do not let referral codes override owned-media attribution by default
- do not keep expanding points and badges as if they are revenue strategy
- do not promise broad long-tail revenue share before attribution and payout controls are solid

## Immediate Next Build Order

1. Add annual host-plan support and attribution schema.
2. Build regional source capture and landing-page tracking.
3. Replace host referral messaging and reward logic with activation-based rewards.
4. Add visibility credits and use them as reward currency.
5. Build partner approval and payout workflow.

## Decision

Ideal Stay should act like a media-powered marketplace, not just a marketplace with a referral widget.

That means:

- owned attention drives acquisition
- content helps activation
- visibility becomes currency
- referral only gets paid when it creates real incremental value
