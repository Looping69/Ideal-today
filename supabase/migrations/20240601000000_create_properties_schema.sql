-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  image TEXT,
  images TEXT[],
  type TEXT NOT NULL,
  amenities TEXT[],
  guests INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  description TEXT,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Public properties are viewable by everyone" 
  ON properties FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" 
  ON properties FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own properties" 
  ON properties FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own properties" 
  ON properties FOR DELETE USING (auth.uid() = host_id);

-- Policies for bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view bookings for their properties" 
  ON bookings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = bookings.property_id 
      AND properties.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" 
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
