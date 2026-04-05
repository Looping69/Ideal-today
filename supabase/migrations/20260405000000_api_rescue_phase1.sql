begin;

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists verification_status text not null default 'none',
  add column if not exists verification_docs jsonb,
  add column if not exists verification_submitted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_verification_status_chk'
  ) then
    alter table public.profiles
      add constraint profiles_verification_status_chk
      check (verification_status in ('none', 'pending', 'verified', 'rejected'));
  end if;
end $$;

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('booking', 'host_plan')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  plan_id text check (plan_id in ('free', 'standard', 'premium')),
  provider_checkout_id text,
  amount numeric not null check (amount >= 0),
  currency text not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider_checkout_id)
);

create index if not exists payment_sessions_user_status_idx
  on public.payment_sessions(user_id, status, created_at desc);

create index if not exists payment_sessions_booking_idx
  on public.payment_sessions(booking_id)
  where booking_id is not null;

create index if not exists bookings_property_status_dates_idx
  on public.bookings(property_id, status, check_in, check_out);

create index if not exists bookings_user_status_idx
  on public.bookings(user_id, status, created_at desc);

create index if not exists messages_booking_created_idx
  on public.messages(booking_id, created_at asc);

drop policy if exists "Public can view bookings" on public.bookings;

update storage.buckets
set public = false
where id = 'verification';

insert into storage.buckets (id, name, public)
values ('verification', 'verification', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Authenticated users can upload verification docs" on storage.objects;
drop policy if exists "Authenticated users can view verification docs" on storage.objects;
drop policy if exists "verification user scoped upload" on storage.objects;
drop policy if exists "verification user scoped read" on storage.objects;
drop policy if exists "verification user scoped delete" on storage.objects;

create policy "verification user scoped upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "verification user scoped read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "verification user scoped delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'verification'
  and auth.uid()::text = (storage.foldername(name))[1]
);

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true),
  ('review-photos', 'review-photos', true),
  ('property-videos', 'property-videos', true)
on conflict (id) do nothing;

drop policy if exists "Allow authenticated uploads to property images" on storage.objects;
drop policy if exists "Allow authenticated updates to property images" on storage.objects;
drop policy if exists "Allow authenticated deletes to property images" on storage.objects;
drop policy if exists "Authenticated upload review photos" on storage.objects;
drop policy if exists "Authenticated users can upload videos" on storage.objects;
drop policy if exists "Users can delete own videos" on storage.objects;
drop policy if exists "avatars user scoped upload" on storage.objects;
drop policy if exists "avatars user scoped delete" on storage.objects;
drop policy if exists "property-images user scoped upload" on storage.objects;
drop policy if exists "property-images user scoped delete" on storage.objects;
drop policy if exists "review-photos user scoped upload" on storage.objects;
drop policy if exists "review-photos user scoped delete" on storage.objects;
drop policy if exists "property-videos user scoped upload" on storage.objects;
drop policy if exists "property-videos user scoped delete" on storage.objects;

create policy "property-images user scoped upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "property-images user scoped delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars user scoped upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars user scoped delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "review-photos user scoped upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'review-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "review-photos user scoped delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'review-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "property-videos user scoped upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "property-videos user scoped delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

commit;
