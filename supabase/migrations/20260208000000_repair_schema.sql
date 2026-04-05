-- consolidated repair migration
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_self_catering BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_restaurant BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS restaurant_offers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_facility TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_properties_video_url ON properties(video_url) WHERE video_url IS NOT NULL;

-- Repair rewards_completions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards_completions' AND column_name = 'id') THEN
        ALTER TABLE rewards_completions ADD COLUMN id uuid DEFAULT gen_random_uuid();
    END IF;
END $$;
