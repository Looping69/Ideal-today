-- Create admin_settings table
create table if not exists public.admin_settings (
  id int primary key default 1 check (id = 1),
  site_name text default 'Ideal Stay',
  support_email text default 'support@idealstay.com',
  meta_description text default 'Find your perfect holiday getaway with Ideal Stay.',
  require_email_verification boolean default true,
  enable_2fa boolean default true,
  maintenance_mode boolean default false,
  service_fee_percent numeric default 10.0,
  welcome_email_template text default 'Welcome to Ideal Stay! We are glad to have you.',
  booking_confirmation_template text default 'Your booking has been confirmed. Enjoy your stay!',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.admin_settings enable row level security;

-- Policies
-- Everyone can read settings (needed for site name, maintenance mode check, etc.)
create policy "Everyone can read admin settings"
  on public.admin_settings for select
  using (true);

-- Only admins can update settings
create policy "Admins can update admin settings"
  on public.admin_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Insert default row if not exists
insert into public.admin_settings (id)
values (1)
on conflict (id) do nothing;

-- Grant access
grant select on public.admin_settings to anon, authenticated;
grant update on public.admin_settings to authenticated;
