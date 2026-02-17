-- Add verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_docs JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE;

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
