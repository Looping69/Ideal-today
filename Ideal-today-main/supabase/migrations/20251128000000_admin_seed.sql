create table if not exists public.admin_invites (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles
  add column if not exists is_admin boolean default false not null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, points, level, badges, is_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    100,
    'Scout',
    '[{"id": "signup", "name": "New Explorer", "icon": "👋", "description": "Joined IdealStay", "date": "' || to_char(now(), 'YYYY-MM-DD') || '"}]'::jsonb,
    exists (select 1 from public.admin_invites ai where ai.email = new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

insert into public.admin_invites (email)
values ('admin@example.com')
on conflict (email) do nothing;
