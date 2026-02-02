-- Update categories table for filter bar with hierarchical structure
-- First, add parent_id if it doesn't exist (optional, but good for future)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'categories' AND COLUMN_NAME = 'parent_id') THEN
        ALTER TABLE categories ADD COLUMN parent_id TEXT REFERENCES categories(id);
    END IF;
END $$;

-- Clear old categories if needed, or just insert/update
TRUNCATE categories CASCADE;

-- Insert new hierarchical categories
-- Parents
INSERT INTO categories (id, label, icon, sort_order) VALUES
  ('hotels-resorts', 'Hotels & Resorts', '🏨', 1),
  ('guesthouses-bnbs', 'Guesthouses & BnB’s', '🛌', 2),
  ('safari-bush', 'Safari and Bush', '🦁', 3),
  ('winelands', 'Winelands', '🍇', 4),
  ('coastal-beach', 'Coastal & Beach', '🏖️', 5),
  ('nature-country', 'Nature & Country', '⛰️', 6),
  ('budget-backpackers', 'Budget & Backpackers', '🎒', 7),
  ('unique-stays', 'Unique Stays', '✨', 8);

-- Subcategories
INSERT INTO categories (id, label, icon, sort_order, parent_id) VALUES
  -- Hotels & Resorts
  ('hotels', 'Hotels', '🏨', 10, 'hotels-resorts'),
  ('boutique-hotels', 'Boutique Hotels', '🏢', 11, 'hotels-resorts'),
  ('resorts-self-catering', 'Resorts – Self-Catering', '🏠', 12, 'hotels-resorts'),
  
  -- Guesthouses & BnB’s
  ('guesthouses', 'Guesthouses', '🛌', 20, 'guesthouses-bnbs'),
  ('bnbs', 'BnB’s', '🍳', 21, 'guesthouses-bnbs'),
  ('farms-guesthouses', 'Farms Guesthouses', '🚜', 22, 'guesthouses-bnbs'),
  
  -- Safari & Bush
  ('bush-lodges', 'Bush Lodges', '🛖', 30, 'safari-bush'),
  ('game-lodge', 'Game Lodge', '🦓', 31, 'safari-bush'),
  ('bush-camps', 'Bush Camps', '⛺', 32, 'safari-bush'),
  ('luxury-safary-lodges', 'Luxury Safary Lodges', '💎', 33, 'safari-bush'),
  ('kruger-park', 'Kruger Park and Surrounding Area', '🐘', 34, 'safari-bush'),
  
  -- Winelands
  ('wine-farms', 'Wine Farms Stays', '🍷', 40, 'winelands'),
  ('winelands-guesthouse', 'Winelands Guesthouse', '🏡', 41, 'winelands'),
  ('luxury-wineland-lodges', 'Luxury Wineland Lodges', '🏰', 42, 'winelands'),
  
  -- Coastal & Beach
  ('beachfront-apartments', 'Beachfront Apartments', '🏢', 50, 'coastal-beach'),
  ('coastal-holiday-homes', 'Coastal Holiday Homes', '🏠', 51, 'coastal-beach'),
  ('coastal-guesthouses', 'Coastal Guesthouses', '🐚', 52, 'coastal-beach'),
  
  -- Nature and Country
  ('lodges-nature-retreats', 'Lodges and Nature Retreats', '🌿', 60, 'nature-country'),
  ('farms-stays', 'Farms Stays', '🐮', 61, 'nature-country'),
  ('mountain-cabins-lodges', 'Mountain Cabins or Lodges', '⛷️', 62, 'nature-country'),
  
  -- Budget Stays
  ('budget-lodges', 'Budget Lodges and Accommodations', '🪙', 70, 'budget-backpackers'),
  ('backpackers', 'Backpackers', '🎒', 71, 'budget-backpackers'),
  
  -- Unique Stay
  ('glamping', 'Glamping', '⛺', 80, 'unique-stays'),
  ('tree-houses', 'Tree Houses', '🌳', 81, 'unique-stays'),
  ('tiny-homes', 'Tiny Homes', '🏠', 82, 'unique-stays'),
  ('historic-stays', 'Historic Stays', '🏛️', 83, 'unique-stays');
