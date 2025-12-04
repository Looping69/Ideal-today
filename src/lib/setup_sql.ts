export const SETUP_SQL = `
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

-- Enable RLS for admin_settings
alter table public.admin_settings enable row level security;

-- Policies for admin_settings
create policy "Everyone can read admin settings"
  on public.admin_settings for select
  using (true);

create policy "Admins can update admin settings"
  on public.admin_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Insert default row for admin_settings
insert into public.admin_settings (id)
values (1)
on conflict (id) do nothing;

-- Grant access for admin_settings
grant select on public.admin_settings to anon, authenticated;
grant update on public.admin_settings to authenticated;

-- Create notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error', 'system')) default 'info',
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
`;
