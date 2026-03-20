alter table public.referral_rewards
  add column if not exists reward_key text;

create unique index if not exists referral_rewards_reward_key_idx
  on public.referral_rewards (reward_key)
  where reward_key is not null;

alter table public.visibility_credits
  add column if not exists reward_key text;

create unique index if not exists visibility_credits_reward_key_idx
  on public.visibility_credits (reward_key)
  where reward_key is not null;

drop trigger if exists reward_on_first_listing on public.properties;
drop function if exists public.reward_on_first_listing();

drop trigger if exists trigger_calculate_referral_commission on public.bookings;
drop function if exists public.calculate_referral_commission();
