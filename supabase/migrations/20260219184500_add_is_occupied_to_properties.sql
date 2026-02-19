-- Add is_occupied column to properties table
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT false;

-- Update existing properties to be not occupied by default (redundant but safe)
UPDATE properties SET is_occupied = false WHERE is_occupied IS NULL;
