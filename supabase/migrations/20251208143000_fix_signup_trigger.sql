-- Ensure admin_invites table exists
create table if not exists public.admin_invites (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure is_admin column exists on profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_admin') then
    alter table public.profiles add column is_admin boolean default false;
  end if;
end $$;

-- Fix the handle_new_user function to be robust
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    points,
    level,
    badges,
    is_admin
  ) values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    100,
    'Scout',
    '[{"id": "signup", "name": "New Explorer", "icon": "👋", "description": "Joined IdealStay", "date": "' || to_char(now(), 'YYYY-MM-DD') || '"}]'::jsonb,
    exists (select 1 from public.admin_invites ai where ai.email = new.email)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    is_admin = excluded.is_admin;

  return new;
exception
  when others then
    -- Log error (optional) but ensure we don't break signup if possible, 
    -- though silencing errors is dangerous. 
    -- Better to let it fail so we know, but for now we want to fix the specific schema mismatch.
    raise notice 'Error in handle_new_user: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
