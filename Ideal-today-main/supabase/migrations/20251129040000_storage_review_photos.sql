insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

create policy "Public read review photos"
  on storage.objects for select
  using ( bucket_id = 'review-photos' );

create policy "Authenticated upload review photos"
  on storage.objects for insert
  with check ( bucket_id = 'review-photos' and auth.role() = 'authenticated' );
