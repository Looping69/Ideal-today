-- ===========================================================
-- IdealStay Migration: Host Plan + Signup Fix
-- Run this in Supabase SQL Editor
-- ===========================================================

-- 1. Ensure admin_invites table exists (for signup trigger)
CREATE TABLE IF NOT EXISTS public.admin_invites (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure host_plan column exists on profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='host_plan') THEN
    ALTER TABLE public.profiles ADD COLUMN host_plan TEXT DEFAULT 'free' CHECK (host_plan IN ('free', 'standard', 'premium'));
  END IF;
END $$;

-- 3. Ensure is_admin column exists on profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 4. Fix the handle_new_user function (robust version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_referral TEXT;
  meta_host_referral TEXT;
  referrer UUID;
  host_referrer UUID;
  code TEXT;
BEGIN
  meta_referral := new.raw_user_meta_data->>'referral_code';
  meta_host_referral := new.raw_user_meta_data->>'host_referral_code';
  
  -- Generate referral code if function exists, otherwise use random
  BEGIN
    code := coalesce(meta_referral, public.generate_referral_code());
  EXCEPTION WHEN undefined_function THEN
    code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  END;

  -- Find referrers if codes provided
  IF meta_referral IS NOT NULL THEN
    SELECT p.id INTO referrer FROM public.profiles p WHERE p.referral_code = meta_referral LIMIT 1;
  END IF;
  
  IF meta_host_referral IS NOT NULL THEN
    SELECT p.id INTO host_referrer FROM public.profiles p WHERE p.host_referral_code = meta_host_referral LIMIT 1;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    points,
    level,
    badges,
    is_admin,
    referral_code,
    referred_by,
    host_referral_code,
    referred_by_host,
    host_plan
  ) VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    100,
    'Scout',
    '[{"id": "signup", "name": "New Explorer", "icon": "👋", "description": "Joined IdealStay", "date": "' || to_char(now(), 'YYYY-MM-DD') || '"}]'::jsonb,
    EXISTS (SELECT 1 FROM public.admin_invites ai WHERE ai.email = new.email),
    code,
    referrer,
    CASE WHEN meta_host_referral IS NOT NULL THEN upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)) ELSE NULL END,
    host_referrer,
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    is_admin = excluded.is_admin;

  -- Create referral records if applicable
  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referee_id, status)
    VALUES (referrer, new.id, 'confirmed')
    ON CONFLICT (referee_id) DO NOTHING;
  END IF;

  IF host_referrer IS NOT NULL THEN
    INSERT INTO public.host_referrals (referrer_id, referee_id, status)
    VALUES (host_referrer, new.id, 'confirmed')
    ON CONFLICT (referee_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log but don't break signup
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    -- Minimal insert as fallback
    INSERT INTO public.profiles (id, email, points, level, badges, host_plan)
    VALUES (new.id, new.email, 100, 'Scout', '[]'::jsonb, 'free')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
