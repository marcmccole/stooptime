-- ============================================================
-- Stoop — "Text your neighbors" homepage signups
-- Run this in your Supabase SQL Editor before the new homepage goes live
-- ============================================================

create table if not exists text_signups (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null unique,   -- normalized to +1XXXXXXXXXX
  address     text not null,
  created_at  timestamptz not null default now()
);

-- No policies on purpose: only the server (service role key) reads or writes this table.
alter table text_signups enable row level security;
