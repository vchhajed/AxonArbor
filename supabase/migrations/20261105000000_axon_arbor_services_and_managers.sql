-- Axon Arbor Phase 2: services a consultant is interested in, and the account
-- manager assigned to each company. Additive; existing rows are unaffected.

alter table public.axon_arbor_consultant_profiles
  add column if not exists services_of_interest text[] not null default '{}';

alter table public.axon_arbor_company_profiles
  add column if not exists account_manager text
  check (account_manager is null or char_length(account_manager) <= 120);
