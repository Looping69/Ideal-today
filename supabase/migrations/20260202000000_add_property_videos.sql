-- Add video_url column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create storage bucket for property videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos',
  'property-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-videos bucket
-- Allow anyone to view videos
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

-- Allow authenticated users to upload videos to their own folder
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-videos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-videos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_properties_video_url ON properties(video_url) WHERE video_url IS NOT NULL;

-- Comment on the column
COMMENT ON COLUMN properties.video_url IS 'URL to the property showcase video (available for Standard and Premium plans)';
