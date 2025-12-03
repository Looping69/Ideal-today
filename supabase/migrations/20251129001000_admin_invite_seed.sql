insert into public.admin_invites (email)
values ('admin@idealtoday.com')
on conflict (email) do nothing;
