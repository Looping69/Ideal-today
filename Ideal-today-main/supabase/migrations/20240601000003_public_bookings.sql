-- Allow public read access to bookings so users can see availability
-- This is necessary for the calendar widget to know which dates are taken
CREATE POLICY "Public can view bookings" ON bookings FOR SELECT USING (true);
