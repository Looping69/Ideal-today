do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='status'
  ) then
    alter table public.reviews add column status text not null default 'pending';
    alter table public.reviews add constraint reviews_status_chk check (status in ('pending','approved','rejected'));
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='rating'
  ) then
    alter table public.reviews add column rating int not null default 5;
    alter table public.reviews add constraint reviews_rating_chk check (rating between 1 and 5);
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='content'
  ) then
    alter table public.reviews add column content text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='booking_id'
  ) then
    alter table public.reviews add column booking_id uuid references public.bookings(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='updated_at'
  ) then
    alter table public.reviews add column updated_at timestamptz not null default timezone('utc'::text, now());
  end if;

  begin
    alter table public.reviews add constraint reviews_unique_user_property unique (user_id, property_id);
  exception when duplicate_object then
    null;
  end;
end $$;

drop policy if exists "reviews: view approved or own" on public.reviews;
create policy "reviews: view approved or own" on public.reviews
  for select using (
    status = 'approved' or user_id = auth.uid() or public.is_admin()
  );

drop policy if exists "reviews: create only for own confirmed booking" on public.reviews;
create policy "reviews: create only for own confirmed booking" on public.reviews
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.bookings b
      where b.user_id = auth.uid()
        and b.property_id = reviews.property_id
        and b.status in ('confirmed','completed')
    )
  );

drop policy if exists "reviews: update own pending or admin any" on public.reviews;
create policy "reviews: update own pending or admin any" on public.reviews
  for update using (
    (user_id = auth.uid() and status = 'pending') or public.is_admin()
  ) with check (
    (user_id = auth.uid() and status = 'pending') or public.is_admin()
  );

drop policy if exists "reviews: delete own pending" on public.reviews;
create policy "reviews: delete own pending" on public.reviews
  for delete using (
    user_id = auth.uid() and status = 'pending'
  );
