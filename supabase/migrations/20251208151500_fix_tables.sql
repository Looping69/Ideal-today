-- Safely create notifications table if it doesn't exist
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error', 'system')) default 'info',
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies (Drop first to avoid conflicts if they exist from a partial run)
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications (mark as read)" on public.notifications;
create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Enable realtime (Safely)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.notifications, public.properties, public.bookings;
commit;

-- Alternatively, simply add it if the publication exists (Postgres < 15 way or if simple)
-- alter publication supabase_realtime add table public.notifications;

-- Ensure rewards_completions table exists (Fix for 400 error)
create table if not exists public.rewards_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_code text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, reward_code)
);

alter table public.rewards_completions enable row level security;

drop policy if exists "view own rewards" on public.rewards_completions;
create policy "view own rewards" on public.rewards_completions
  for select using (auth.uid() = user_id);

drop policy if exists "add own rewards" on public.rewards_completions;
create policy "add own rewards" on public.rewards_completions
  for insert with check (auth.uid() = user_id);
