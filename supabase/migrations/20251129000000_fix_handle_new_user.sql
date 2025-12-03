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
end;
$$ language plpgsql security definer;
