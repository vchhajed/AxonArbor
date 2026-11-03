-- Axon Arbor: the trainer / consultant network roster, compiled by the team
-- from profiles and LinkedIn ("Website Content Database of Trainers" sheet).
-- Trainers and consultants are the same people here. Holds contact details
-- and rates, so it is server-only: RLS on with no policies, read through the
-- secret key from the admin panel. account_id links a roster entry to a
-- platform login if that trainer later signs up.

create table public.axon_arbor_trainer_roster (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  full_name text not null check (char_length(full_name) between 1 and 120),
  city text check (city is null or char_length(city) <= 120),
  specialities text[] not null default '{}',
  years_experience text check (years_experience is null or char_length(years_experience) <= 200),
  certifications text,
  qualifications text,
  key_clients text,
  testimonials text,
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  linkedin_url text check (linkedin_url is null or char_length(linkedin_url) <= 300),
  price_per_hour text check (price_per_hour is null or char_length(price_per_hour) <= 200),
  price_half_day text check (price_half_day is null or char_length(price_half_day) <= 200),
  availability text check (availability is null or char_length(availability) <= 300),
  photo_path text check (photo_path is null or char_length(photo_path) <= 300),
  verification_note text check (verification_note is null or char_length(verification_note) <= 300),
  account_id uuid references public.axon_arbor_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.axon_arbor_trainer_roster is
  'Trainer/consultant network compiled by Axon Arbor. Contains contact details and rates: server-only (no RLS policies).';
create index axon_arbor_trainer_roster_account_idx on public.axon_arbor_trainer_roster (account_id);
alter table public.axon_arbor_trainer_roster enable row level security;
