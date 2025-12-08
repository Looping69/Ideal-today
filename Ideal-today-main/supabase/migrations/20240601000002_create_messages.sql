-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own bookings (as guest or host)
CREATE POLICY "Users can view messages for their bookings" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM bookings WHERE id = messages.booking_id
    )
    OR
    auth.uid() IN (
      SELECT p.host_id 
      FROM properties p
      JOIN bookings b ON b.property_id = p.id
      WHERE b.id = messages.booking_id
    )
  );

-- Policy: Users can insert messages for their own bookings (as guest or host)
-- AND only if the booking is confirmed
CREATE POLICY "Users can send messages for confirmed bookings" ON messages
  FOR INSERT WITH CHECK (
    (
      auth.uid() IN (
        SELECT user_id FROM bookings WHERE id = booking_id
      )
      OR
      auth.uid() IN (
        SELECT p.host_id 
        FROM properties p
        JOIN bookings b ON b.property_id = p.id
        WHERE b.id = booking_id
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND status = 'confirmed'
    )
  );

-- Create realtime publication for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
