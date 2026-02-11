-- Migration to secure host verification documents
-- Making the bucket private and adding RLS policies

-- 1. Update bucket to private if it exists
UPDATE storage.buckets 
SET public = false 
WHERE id = 'verification';

-- 2. Create bucket if it doesn't exist (safety)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification', 'verification', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for verification bucket
-- NOTE: bucket_id is used in storage.objects

-- Allow users to upload their own verification documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own verification documents
CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all verification documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Allow users to delete their own verification documents (cleanup)
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'verification' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
