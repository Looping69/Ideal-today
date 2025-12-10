-- Add cleaning_fee, service_fee, and categories columns to properties table
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Update categories based on existing location data to maintain functionality
UPDATE properties
SET categories = array_append(categories, 'beach')
WHERE location ILIKE '%Camps Bay%' OR location ILIKE '%Umhlanga%';

UPDATE properties
SET categories = array_append(categories, 'safari')
WHERE location ILIKE '%Kruger%';

UPDATE properties
SET categories = array_append(categories, 'winelands')
WHERE location ILIKE '%Franschhoek%';

UPDATE properties
SET categories = array_append(categories, 'city')
WHERE location ILIKE '%Johannesburg%' OR location ILIKE '%Cape Town%';

UPDATE properties
SET categories = array_append(categories, 'mountain')
WHERE location ILIKE '%Drakensberg%' OR location ILIKE '%Table Mountain%';
