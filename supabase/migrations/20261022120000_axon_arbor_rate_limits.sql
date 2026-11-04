-- Axon Arbor: rate limiting for sign-in, admin login and sign-up.
-- One row per attempt, keyed like "signin-email:someone@x.com" or "signup-ip:1.2.3.4".
-- Server-only (service role); RLS on with no policies so the public key can't read it.

create table if not exists public.axon_arbor_rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists axon_arbor_rate_limits_key_time on public.axon_arbor_rate_limits (key, created_at desc);

alter table public.axon_arbor_rate_limits enable row level security;
