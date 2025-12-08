create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean as $$
declare
  flag boolean;
begin
  select is_admin into flag from public.profiles where id = auth.uid();
  return coalesce(flag, false);
end;
$$ language plpgsql stable;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  content text,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, property_id)
);

alter table public.reviews enable row level security;

create or replace function public.update_property_reviews(p_property_id uuid)
returns void as $$
begin
  update public.properties p set
    rating = (
      select coalesce(avg(r.rating), 0)
      from public.reviews r
      where r.property_id = p.id and r.status = 'approved'
    ),
    reviews_count = (
      select count(*)
      from public.reviews r
      where r.property_id = p.id and r.status = 'approved'
    )
  where p.id = p_property_id;
end;
$$ language plpgsql security definer;

create or replace function public.reviews_updated()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    perform public.update_property_reviews(old.property_id);
  else
    perform public.update_property_reviews(new.property_id);
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists reviews_updated on public.reviews;
create trigger reviews_updated
after insert or update or delete on public.reviews
for each row execute function public.reviews_updated();

create index if not exists reviews_property_idx on public.reviews(property_id);
create index if not exists reviews_user_idx on public.reviews(user_id);
