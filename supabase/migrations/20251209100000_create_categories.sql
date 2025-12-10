-- Create categories table for filter bar
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_province BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT USING (true);

-- Admin can manage categories
CREATE POLICY "Admins can manage categories" 
  ON categories FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Seed categories data
INSERT INTO categories (id, label, icon, sort_order, is_province) VALUES
  ('all', 'All', '🏠', 0, false),
  ('apartment', 'Apartments', '🏢', 1, false),
  ('house', 'Houses', '🏡', 2, false),
  ('guesthouse', 'Guesthouses', '🛌', 3, false),
  ('beach', 'Beachfront', '🏖️', 4, false),
  ('safari', 'Safari', '🦁', 5, false),
  ('winelands', 'Winelands', '🍇', 6, false),
  ('city', 'City', '🏙️', 7, false),
  ('mountain', 'Mountain', '⛰️', 8, false),
  ('pool', 'Amazing Pools', '🏊', 9, false),
  -- Provinces
  ('western-cape', 'Western Cape', '⛵', 10, true),
  ('eastern-cape', 'Eastern Cape', '🦅', 11, true),
  ('northern-cape', 'Northern Cape', '🏜️', 12, true),
  ('gauteng', 'Gauteng', '🏙️', 13, true),
  ('kwazulu-natal', 'KwaZulu-Natal', '🌊', 14, true),
  ('free-state', 'Free State', '🌾', 15, true),
  ('north-west', 'North West', '🌻', 16, true),
  ('mpumalanga', 'Mpumalanga', '🌿', 17, true),
  ('limpopo', 'Limpopo', '🦓', 18, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_province = EXCLUDED.is_province;
