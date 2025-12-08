
-- Create storage buckets if they don't exist
insert into storage.buckets (id, name, public)
values 
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Public access to property images
create policy "Give public access to property images"
  on storage.objects for select
  using ( bucket_id = 'property-images' );

-- Policy: Authenticated users can upload property images
create policy "Allow authenticated uploads to property images"
  on storage.objects for insert
  with check ( bucket_id = 'property-images' and auth.role() = 'authenticated' );

-- Policy: Public access to avatars
create policy "Give public access to avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload avatars
create policy "Allow authenticated uploads to avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
