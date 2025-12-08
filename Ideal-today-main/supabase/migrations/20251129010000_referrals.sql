create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid unique references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','confirmed','rewarded')) default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  rewarded_at timestamptz
);

alter table public.referrals enable row level security;

create policy "own referrals view" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

create or replace function public.generate_referral_code()
returns text as $$
begin
  return upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
end;
$$ language plpgsql stable;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_referral text;
  referrer uuid;
  code text;
begin
  meta_referral := new.raw_user_meta_data->>'referral_code';
  code := coalesce(meta_referral, public.generate_referral_code());

  select p.id into referrer from public.profiles p where p.referral_code = meta_referral limit 1;

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    points,
    level,
    badges,
    is_admin,
    referral_code,
    referred_by
  ) values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    100,
    'Scout',
    '[{"id": "signup", "name": "New Explorer", "icon": "👋", "description": "Joined IdealStay", "date": "' || to_char(now(), 'YYYY-MM-DD') || '"}]'::jsonb,
    exists (select 1 from public.admin_invites ai where ai.email = new.email),
    code,
    referrer
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    is_admin = excluded.is_admin,
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by);

  if referrer is not null then
    insert into public.referrals (referrer_id, referee_id, status)
    values (referrer, new.id, 'confirmed')
    on conflict (referee_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.reward_on_first_booking()
returns trigger as $$
declare
  referrer uuid;
begin
  if new.status = 'confirmed' then
    select referred_by into referrer from public.profiles where id = new.user_id;
    if referrer is not null then
      update public.referrals set status = 'rewarded', rewarded_at = timezone('utc'::text, now())
      where referee_id = new.user_id and status <> 'rewarded';

      update public.profiles set points = points + 500 where id = referrer;
      update public.profiles set points = points + 200 where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists reward_on_booking on public.bookings;
create trigger reward_on_booking
after insert on public.bookings
for each row execute function public.reward_on_first_booking();
