-- Extend properties table with new fields for detailed listings
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_self_catering BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_restaurant BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS restaurant_offers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_facility TEXT;
