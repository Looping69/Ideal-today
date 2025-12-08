alter table public.profiles
  add column if not exists host_referral_code text,
  add column if not exists referred_by_host uuid references public.profiles(id);

create table if not exists public.host_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid unique references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','confirmed','rewarded')) default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  rewarded_at timestamptz
);

alter table public.host_referrals enable row level security;

create policy "own host referrals view" on public.host_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_referral text;
  meta_host_referral text;
  referrer uuid;
  host_referrer uuid;
  code text;
begin
  meta_referral := new.raw_user_meta_data->>'referral_code';
  meta_host_referral := new.raw_user_meta_data->>'host_referral_code';
  code := coalesce(meta_referral, public.generate_referral_code());

  select p.id into referrer from public.profiles p where p.referral_code = meta_referral limit 1;
  select p.id into host_referrer from public.profiles p where p.host_referral_code = meta_host_referral limit 1;

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
    referred_by,
    host_referral_code,
    referred_by_host
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
    referrer,
    meta_host_referral,
    host_referrer
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    is_admin = excluded.is_admin,
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    host_referral_code = coalesce(public.profiles.host_referral_code, excluded.host_referral_code),
    referred_by_host = coalesce(public.profiles.referred_by_host, excluded.referred_by_host);

  if referrer is not null then
    insert into public.referrals (referrer_id, referee_id, status)
    values (referrer, new.id, 'confirmed')
    on conflict (referee_id) do nothing;
  end if;

  if host_referrer is not null then
    insert into public.host_referrals (referrer_id, referee_id, status)
    values (host_referrer, new.id, 'confirmed')
    on conflict (referee_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.reward_on_first_listing()
returns trigger as $$
declare
  host_referrer uuid;
  updated_count int := 0;
begin
  select referred_by_host into host_referrer from public.profiles where id = new.host_id;
  if host_referrer is not null then
    update public.host_referrals
    set status = 'rewarded', rewarded_at = timezone('utc'::text, now())
    where referee_id = new.host_id and status <> 'rewarded';
    get diagnostics updated_count = row_count;
    if updated_count > 0 then
      update public.profiles set points = points + 1000 where id = host_referrer;
      update public.profiles set points = points + 500 where id = new.host_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists reward_on_first_listing on public.properties;
create trigger reward_on_first_listing
after insert on public.properties
for each row execute function public.reward_on_first_listing();
