-- Upgrade Referrals: Founding Member Support & Revenue Sharing
-- Migration: 20260217000000_upgrade_referrals.sql

-- 1. Add new columns to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_founding_member') THEN
        ALTER TABLE public.profiles ADD COLUMN is_founding_member boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'balance') THEN
        ALTER TABLE public.profiles ADD COLUMN balance numeric(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 2. Create referral_commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    percentage numeric(5, 2) NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own commissions"
ON public.referral_commissions FOR SELECT
USING (auth.uid() = referrer_id);

-- 3. Create Function to Calculate Commission
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id uuid;
    v_referrer_id uuid;
    v_is_founding boolean;
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

        -- Get referrer details and referral date
        SELECT is_founding_member INTO v_is_founding
        FROM public.profiles
        WHERE id = v_referrer_id;

        SELECT created_at INTO v_referral_date
        FROM public.host_referrals
        WHERE referrer_id = v_referrer_id AND referee_id = v_host_id
        LIMIT 1;

        -- If no referral record found (shouldn't happen if referred_by_host is set, but safety check)
        IF v_referral_date IS NULL THEN
            RETURN NEW;
        END IF;

        -- Calculate months passed
        v_months_since_referral := EXTRACT(YEAR FROM age(now(), v_referral_date)) * 12 + 
                                   EXTRACT(MONTH FROM age(now(), v_referral_date));

        -- Calculate Base Service Fee (Revenue basis)
        -- Default to 10% if property fee is null
        v_service_fee := NEW.total_price * (COALESCE(v_property_fee, 10.0) / 100.0);

        -- Determine Percentage
        v_percentage := 0;

        IF v_is_founding THEN
            -- Founding Member Logic
            IF v_months_since_referral < 12 THEN
                v_percentage := 40; -- 40% for first year
            ELSE
                v_percentage := 20; -- 20% thereafter
            END IF;
        ELSE
            -- Standard Member Logic
            IF v_months_since_referral < 3 THEN
                v_percentage := 20; -- 20% for first 3 months
            ELSE
                v_percentage := 0; -- 0% thereafter
            END IF;
        END IF;

        -- Calculate Commission Amount
        IF v_percentage > 0 THEN
            v_commission_amount := v_service_fee * (v_percentage / 100.0);

            -- Insert Commission Record
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

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trigger_calculate_referral_commission ON public.bookings;
CREATE TRIGGER trigger_calculate_referral_commission
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_referral_commission();
