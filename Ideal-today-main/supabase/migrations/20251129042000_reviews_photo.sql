do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='reviews' and column_name='photo_url'
  ) then
    alter table public.reviews add column photo_url text;
  end if;
end $$;
