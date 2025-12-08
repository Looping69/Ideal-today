alter table public.profiles
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists preferences jsonb default '{}'::jsonb,
  add column if not exists deactivated boolean default false;
