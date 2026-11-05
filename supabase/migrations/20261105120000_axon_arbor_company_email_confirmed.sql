-- Axon Arbor Phase 2: when a company confirmed it can read the inbox it
-- registered with. Additive; existing rows are unaffected.

alter table public.axon_arbor_company_profiles
  add column if not exists email_confirmed_at timestamptz;
