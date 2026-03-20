alter table public.payment_sessions
  add column if not exists target_plan_interval text check (target_plan_interval in ('monthly', 'annual'));

update public.payment_sessions
set target_plan_interval = coalesce(target_plan_interval, 'monthly')
where kind = 'host_plan'
  and target_plan is not null;

alter table public.profiles
  add column if not exists host_plan_interval text check (host_plan_interval in ('monthly', 'annual')),
  add column if not exists host_plan_started_at timestamptz,
  add column if not exists host_plan_expires_at timestamptz;

update public.profiles
set host_plan_interval = coalesce(host_plan_interval, 'monthly')
where host_plan is not null
  and host_plan <> 'free';

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('owned_media', 'host_referral', 'partner_referral', 'guest_referral', 'organic', 'paid_media')),
  source_key text not null,
  source_label text,
  referrer_profile_id uuid references public.profiles(id) on delete set null,
  partner_profile_id uuid references public.profiles(id) on delete set null,
  captured_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists referral_attributions_source_type_idx
  on public.referral_attributions (source_type);

create index if not exists referral_attributions_source_key_idx
  on public.referral_attributions (source_key);

alter table public.referral_attributions enable row level security;

drop policy if exists "Users can view their own attributions" on public.referral_attributions;
create policy "Users can view their own attributions"
  on public.referral_attributions for select
  using (auth.uid() = user_id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  beneficiary_profile_id uuid not null references public.profiles(id) on delete cascade,
  attribution_id uuid references public.referral_attributions(id) on delete set null,
  reward_type text not null check (reward_type in ('cash', 'account_credit', 'visibility_credit', 'content_pack', 'plan_discount')),
  reward_stage text not null check (reward_stage in ('activation', 'retention', 'first_booking', 'annual_upgrade')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'voided', 'consumed')),
  amount numeric(10, 2),
  currency text not null default 'ZAR',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  approved_at timestamptz,
  paid_at timestamptz
);

create index if not exists referral_rewards_beneficiary_idx
  on public.referral_rewards (beneficiary_profile_id, status, reward_stage);

alter table public.referral_rewards enable row level security;

drop policy if exists "Users can view their own referral rewards" on public.referral_rewards;
create policy "Users can view their own referral rewards"
  on public.referral_rewards for select
  using (auth.uid() = beneficiary_profile_id);

create table if not exists public.visibility_credits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  credit_type text not null check (credit_type in ('regional_feature', 'homepage_boost', 'holiday_spotlight', 'content_launch_pack')),
  quantity integer not null default 1 check (quantity > 0),
  source text not null,
  expires_at timestamptz,
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists visibility_credits_profile_idx
  on public.visibility_credits (profile_id, consumed_at, expires_at);

alter table public.visibility_credits enable row level security;

drop policy if exists "Users can view their own visibility credits" on public.visibility_credits;
create policy "Users can view their own visibility credits"
  on public.visibility_credits for select
  using (auth.uid() = profile_id);

create table if not exists public.partner_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  partner_code text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  tier text not null default 'partner' check (tier in ('partner', 'pro_partner', 'market_lead')),
  region_focus text,
  commission_model text,
  payout_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.partner_profiles enable row level security;

drop policy if exists "Users can view their own partner profile" on public.partner_profiles;
create policy "Users can view their own partner profile"
  on public.partner_profiles for select
  using (auth.uid() = profile_id);
