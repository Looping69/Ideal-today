create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('booking', 'host_plan')),
  target_booking_id uuid references public.bookings(id) on delete cascade,
  target_plan text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  yoco_checkout_id text unique,
  yoco_event_id text,
  provider_payment_id text,
  provider_response jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_sessions enable row level security;

drop policy if exists "Users can view their own payment sessions" on public.payment_sessions;
create policy "Users can view their own payment sessions"
  on public.payment_sessions for select
  using (auth.uid() = user_id);

alter table public.bookings
  add column if not exists payment_status text not null default 'pending',
  add column if not exists confirmed_at timestamptz;

create table if not exists public.content_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  request_payload jsonb not null,
  response_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.content_generations enable row level security;

drop policy if exists "Users can view their own content generations" on public.content_generations;
create policy "Users can view their own content generations"
  on public.content_generations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content generations" on public.content_generations;
create policy "Users can insert their own content generations"
  on public.content_generations for insert
  with check (auth.uid() = user_id);
