create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, property_id)
);

alter table public.wishlists enable row level security;

create policy "view own wishlists" on public.wishlists
  for select using (auth.uid() = user_id);

create policy "add own wishlists" on public.wishlists
  for insert with check (auth.uid() = user_id);

create policy "delete own wishlists" on public.wishlists
  for delete using (auth.uid() = user_id);

create index if not exists wishlists_user_idx on public.wishlists(user_id);
create index if not exists wishlists_property_idx on public.wishlists(property_id);
