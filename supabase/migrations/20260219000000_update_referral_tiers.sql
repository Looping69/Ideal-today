-- Migration: 20260219000000_update_referral_tiers.sql
-- Goal: Update referral system to support 3 tiers (Founder, Pro, Standard) with annual decay.

-- 1. Create referral_tier type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_tier') THEN
        CREATE TYPE public.referral_tier AS ENUM ('founder', 'pro', 'standard');
    END IF;
END $$;

-- 2. Add referral_tier column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_tier') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_tier public.referral_tier DEFAULT 'pro';
    END IF;
END $$;

-- 3. Migrate existing founding member data (only if is_founding_member column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_founding_member') THEN
        UPDATE public.profiles SET referral_tier = 'founder' WHERE is_founding_member = true;
        UPDATE public.profiles SET referral_tier = 'standard' WHERE is_founding_member = false AND referral_tier IS NULL;
    END IF;
END $$;

-- 4. Update the commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id uuid;
    v_referrer_id uuid;
    v_tier public.referral_tier;
    v_referral_date timestamptz;
    v_service_fee numeric;
    v_commission_amount numeric;
    v_percentage numeric;
    v_months_since_referral int;
    v_property_fee numeric;
BEGIN
    -- Only run when booking becomes confirmed
    IF NEW.status = 'confirmed' AND OLD.status <> 'confirmed' THEN
        
        -- Get the property owner (host)
        SELECT host_id, service_fee INTO v_host_id, v_property_fee 
        FROM public.properties 
        WHERE id = NEW.property_id;

        -- Check if host was referred by another host
        SELECT referred_by_host INTO v_referrer_id
        FROM public.profiles
        WHERE id = v_host_id;

        -- If no referrer, exit
        IF v_referrer_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Get referrer details (tier)
        SELECT referral_tier INTO v_tier
        FROM public.profiles
        WHERE id = v_referrer_id;

        -- Get referral date to calculate decay
        SELECT created_at INTO v_referral_date
        FROM public.host_referrals
        WHERE referrer_id = v_referrer_id AND referee_id = v_host_id
        LIMIT 1;

        -- If no referral record found, use profile creation as fallback or exit
        IF v_referral_date IS NULL THEN
            RETURN NEW;
        END IF;

        -- Calculate months passed since referral
        v_months_since_referral := EXTRACT(YEAR FROM age(now(), v_referral_date)) * 12 + 
                                   EXTRACT(MONTH FROM age(now(), v_referral_date));

        -- Calculate Base Service Fee (Revenue basis) - Default to 10%
        v_service_fee := NEW.total_price * (COALESCE(v_property_fee, 10.0) / 100.0);

        -- Tiered Logic Implementation
        v_percentage := 0;

        IF v_tier = 'founder' THEN
            -- Founder: 40% (Year 1) -> 20% (Thereafter)
            IF v_months_since_referral < 12 THEN
                v_percentage := 40;
            ELSE
                v_percentage := 20;
            END IF;
        ELSIF v_tier = 'pro' THEN
            -- Pro: 20% (Year 1) -> 10% (Thereafter)
            IF v_months_since_referral < 12 THEN
                v_percentage := 20;
            ELSE
                v_percentage := 10;
            END IF;
        ELSIF v_tier = 'standard' THEN
            -- Standard: 10% (Year 1) -> 5% (Thereafter)
            IF v_months_since_referral < 12 THEN
                v_percentage := 10;
            ELSE
                v_percentage := 5;
            END IF;
        END IF;

        -- Calculate and Insert Commission
        IF v_percentage > 0 THEN
            v_commission_amount := v_service_fee * (v_percentage / 100.0);

            INSERT INTO public.referral_commissions (booking_id, referrer_id, referee_host_id, amount, percentage)
            VALUES (NEW.id, v_referrer_id, v_host_id, v_commission_amount, v_percentage);

            -- Update Referrer Balance
            UPDATE public.profiles
            SET balance = COALESCE(balance, 0) + v_commission_amount
            WHERE id = v_referrer_id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
