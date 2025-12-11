-- Fix Storage Policies for IdealStay

-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Give public access to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to property images" ON storage.objects;

-- 3. Re-create robust policies

-- Public Read Access
CREATE POLICY "Give public access to property images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- Authenticated Insert Access (Uploads)
CREATE POLICY "Allow authenticated uploads to property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Authenticated Update Access
CREATE POLICY "Allow authenticated updates to property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Authenticated Delete Access
CREATE POLICY "Allow authenticated deletes to property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);
