-- Add profile fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Add approval status to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Set existing listings as approved so current live sites aren't disrupted
UPDATE properties SET approval_status = 'approved';
