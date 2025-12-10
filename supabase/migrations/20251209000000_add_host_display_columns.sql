-- Create a demo host profile for seed properties
-- Since profiles.id must reference auth.users, we'll use a different approach
-- We'll add host_name and host_avatar columns directly to properties for display when host_id is null

-- Add optional host display columns to properties
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS host_name TEXT,
  ADD COLUMN IF NOT EXISTS host_avatar TEXT,
  ADD COLUMN IF NOT EXISTS host_joined TEXT;

-- Update seed properties with host display data
UPDATE properties 
SET 
  host_name = CASE 
    WHEN location LIKE '%Cape Town%' THEN 'Sarah'
    WHEN location LIKE '%Kruger%' THEN 'Thabo'
    WHEN location LIKE '%Franschhoek%' THEN 'Michael'
    WHEN location LIKE '%Johannesburg%' OR location LIKE '%Sandton%' THEN 'Lerato'
    ELSE 'Host'
  END,
  host_avatar = CASE 
    WHEN location LIKE '%Cape Town%' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    WHEN location LIKE '%Kruger%' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thabo'
    WHEN location LIKE '%Franschhoek%' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
    WHEN location LIKE '%Johannesburg%' OR location LIKE '%Sandton%' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lerato'
    ELSE 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host'
  END,
  host_joined = '2023'
WHERE host_id IS NULL AND host_name IS NULL;
