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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_settings' 
        AND policyname = 'Everyone can read admin settings'
    ) THEN
        CREATE POLICY "Everyone can read admin settings" 
        ON public.admin_settings FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_settings' 
        AND policyname = 'Admins can update admin settings'
    ) THEN
        CREATE POLICY "Admins can update admin settings" 
        ON public.admin_settings FOR UPDATE 
        USING (
            exists (
              select 1 from public.profiles
              where id = auth.uid() and is_admin = true
            )
        );
    END IF;
END $$;

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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" 
        ON public.notifications FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update their own notifications (mark as read)'
    ) THEN
        CREATE POLICY "Users can update their own notifications (mark as read)" 
        ON public.notifications FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Admins can insert notifications'
    ) THEN
        CREATE POLICY "Admins can insert notifications" 
        ON public.notifications FOR INSERT 
        WITH CHECK (
            exists (
              select 1 from public.profiles
              where id = auth.uid() and is_admin = true
            )
        );
    END IF;
END $$;

-- Enable realtime for notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 2025-12-12 Migration: Host Profile & Listing Approvals

-- Add profile fields to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_address') THEN
        ALTER TABLE profiles ADD COLUMN business_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_docs') THEN
        ALTER TABLE profiles ADD COLUMN verification_docs JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_submitted_at') THEN
        ALTER TABLE profiles ADD COLUMN verification_submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- RLS Policy: Allow admins to update any profile (for verification approval)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can update any profile'
    ) THEN
        CREATE POLICY "Admins can update any profile" 
        ON public.profiles FOR UPDATE 
        USING (
            exists (
              select 1 from public.profiles
              where id = auth.uid() and is_admin = true
            )
        );
    END IF;
END $$;

-- Add approval status to properties table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'approval_status') THEN
        ALTER TABLE properties ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
        -- Set existing listings as approved
        UPDATE properties SET approval_status = 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'rejection_reason') THEN
        ALTER TABLE properties ADD COLUMN rejection_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_featured') THEN
        ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create verification bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification', 'verification', true)
ON CONFLICT (id) DO NOTHING;

-- Verification bucket policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Authenticated users can upload verification docs'
    ) THEN
        CREATE POLICY "Authenticated users can upload verification docs" 
        ON storage.objects FOR INSERT 
        TO authenticated 
        WITH CHECK (bucket_id = 'verification');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Authenticated users can view verification docs'
    ) THEN
        CREATE POLICY "Authenticated users can view verification docs" 
        ON storage.objects FOR SELECT 
        TO authenticated 
        USING (bucket_id = 'verification');
    END IF;
END $$;
`;
