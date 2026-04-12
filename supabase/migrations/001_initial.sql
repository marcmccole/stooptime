-- ============================================================
-- Stoop — initial schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Events
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid references auth.users not null,
  vibe          text,
  size          text,
  address       text,
  event_date    date,
  event_time    text,
  family_name   text,
  partner_name  text,
  family_note   text,
  why_note      text,
  photo_url     text,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

-- RSVPs (anonymous guests, no auth required)
create table if not exists rsvps (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events not null,
  family_name   text,
  email         text,
  phone         text,
  guest_count   int not null default 1,
  has_partner   boolean not null default false,
  has_kids      boolean not null default false,
  kid_count     int not null default 0,
  has_dog       boolean not null default false,
  family_note   text,
  photo_url     text,
  status        text not null default 'going',
  created_at    timestamptz not null default now()
);

-- Tasks (seeded from vibe defaults, can be claimed by guests)
create table if not exists tasks (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid references events not null,
  title               text not null,
  category            text not null default 'OTHER',
  is_default          boolean not null default true,
  claimed_by_rsvp_id  uuid references rsvps,
  claimed_by_name     text,
  created_at          timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────

alter table events enable row level security;
alter table rsvps   enable row level security;
alter table tasks   enable row level security;

-- Events: anyone can read active events (RSVP page needs this without auth)
create policy "events_public_read"
  on events for select
  using (status = 'active');

-- Events: authenticated hosts can do everything to their own events
create policy "events_host_all"
  on events for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- RSVPs: anyone can read (guest list is public to event attendees)
create policy "rsvps_public_read"
  on rsvps for select
  using (true);

-- RSVPs: anyone can insert (no auth required to RSVP)
create policy "rsvps_public_insert"
  on rsvps for insert
  with check (true);

-- Tasks: anyone can read
create policy "tasks_public_read"
  on tasks for select
  using (true);

-- Tasks: authenticated users can insert (host seeds tasks)
create policy "tasks_host_insert"
  on tasks for insert
  with check (auth.uid() is not null);

-- Tasks: anyone can claim/unclaim (update claimed_by fields only)
create policy "tasks_claim_update"
  on tasks for update
  using (true)
  with check (true);

-- ── Storage buckets ──────────────────────────────────────────
-- Run these too, or create the buckets manually in the Supabase dashboard:
--
-- insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true);
-- insert into storage.buckets (id, name, public) values ('rsvp-photos', 'rsvp-photos', true);
--
-- Storage policies (paste into SQL editor after creating buckets):
--
-- create policy "event_photos_public_read" on storage.objects for select using (bucket_id = 'event-photos');
-- create policy "event_photos_auth_insert" on storage.objects for insert with check (bucket_id = 'event-photos' and auth.uid() is not null);
-- create policy "rsvp_photos_public_read"  on storage.objects for select using (bucket_id = 'rsvp-photos');
-- create policy "rsvp_photos_public_insert" on storage.objects for insert with check (bucket_id = 'rsvp-photos');
