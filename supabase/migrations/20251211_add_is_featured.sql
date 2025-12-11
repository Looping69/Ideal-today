-- Add is_featured column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create an index for faster queries on featured properties
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON properties(is_featured) WHERE is_featured = true;
