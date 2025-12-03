create table if not exists public.rewards_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_code text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, reward_code)
);

alter table public.rewards_completions enable row level security;

create policy "view own rewards" on public.rewards_completions
  for select using (auth.uid() = user_id);

create policy "add own rewards" on public.rewards_completions
  for insert with check (auth.uid() = user_id);

create or replace function public.claim_coastal_explorer()
returns text as $$
declare
  u uuid := auth.uid();
  has_booking boolean;
  already boolean;
begin
  select exists (
    select 1 from public.bookings b
    join public.properties p on p.id = b.property_id
    where b.user_id = u and b.status in ('confirmed','completed')
      and (p.location ilike '%cape town%' or p.location ilike '%durban%')
  ) into has_booking;

  if not has_booking then
    return 'not_eligible';
  end if;

  select exists (
    select 1 from public.rewards_completions rc
    where rc.user_id = u and rc.reward_code = 'coastal_explorer'
  ) into already;

  if already then
    return 'already_claimed';
  end if;

  insert into public.rewards_completions(user_id, reward_code)
  values (u, 'coastal_explorer');

  update public.profiles set points = points + 500 where id = u;

  update public.profiles p
  set badges = p.badges || jsonb_build_array(jsonb_build_object(
      'id','coastal_explorer','name','Coastal Explorer','icon','🌊','description','Booked Cape Town/Durban','date',to_char(now(),'YYYY-MM-DD')
    ))
  where p.id = u
    and not exists (
      select 1 from jsonb_array_elements(p.badges) b where b->>'id' = 'coastal_explorer'
    );

  return 'claimed';
end;
$$ language plpgsql security definer;

create or replace function public.claim_photo_finisher()
returns text as $$
declare
  u uuid := auth.uid();
  has_photo_review boolean;
  already boolean;
begin
  select exists (
    select 1 from public.reviews r
    where r.user_id = u and r.status = 'approved' and r.photo_url is not null
  ) into has_photo_review;

  if not has_photo_review then
    return 'not_eligible';
  end if;

  select exists (
    select 1 from public.rewards_completions rc
    where rc.user_id = u and rc.reward_code = 'photo_finisher'
  ) into already;

  if already then
    return 'already_claimed';
  end if;

  insert into public.rewards_completions(user_id, reward_code)
  values (u, 'photo_finisher');

  update public.profiles set points = points + 200 where id = u;

  update public.profiles p
  set badges = p.badges || jsonb_build_array(jsonb_build_object(
      'id','photo_finisher','name','Photo Finisher','icon','📸','description','Uploaded photo with review','date',to_char(now(),'YYYY-MM-DD')
    ))
  where p.id = u
    and not exists (
      select 1 from jsonb_array_elements(p.badges) b where b->>'id' = 'photo_finisher'
    );

  return 'claimed';
end;
$$ language plpgsql security definer;
