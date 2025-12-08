alter table public.properties
  add column if not exists province text;

alter table public.properties
  add constraint properties_province_valid
  check (
    province is null or province in (
      'Western Cape', 'Eastern Cape', 'Northern Cape', 'Gauteng',
      'KwaZulu-Natal', 'Free State', 'North West', 'Mpumalanga', 'Limpopo'
    )
  );
