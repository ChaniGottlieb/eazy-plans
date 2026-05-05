-- ============================================================
-- Eazyplans - Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'secretary', 'venue_owner');
create type event_type as enum ('morning', 'evening', 'full_day', 'shabbat');
create type event_purpose as enum ('wedding', 'bar_mitzvah', 'bat_mitzvah', 'birthday', 'conference', 'other');
create type event_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type lead_status as enum ('new', 'considering', 'waiting_for_date', 'date_taken', 'booked', 'cancelled');
create type email_type as enum ('owner_request', 'client_confirm', 'reminder');
create type email_status as enum ('sent', 'failed');

-- ─────────────────────────────────────────────────────────────
-- USERS (extends Supabase Auth)
-- ─────────────────────────────────────────────────────────────

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null default 'secretary',
  created_at timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role_text text;
  v_role user_role;
begin
  v_role_text := new.raw_user_meta_data->>'role';

  if v_role_text in ('admin', 'secretary', 'venue_owner') then
    v_role := v_role_text::user_role;
  else
    v_role := 'secretary';
  end if;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'משתמש חדש'),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- VENUES
-- ─────────────────────────────────────────────────────────────

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  neighborhood text,
  max_capacity integer not null,
  price_morning numeric(10,2),
  price_evening numeric(10,2),
  price_full_day numeric(10,2),
  price_shabbat numeric(10,2),
  description_short text,
  description_long text,
  parking_info text,
  public_transport_info text,
  hours_morning_start time,
  hours_morning_end time,
  hours_evening_start time,
  hours_evening_end time,
  hours_full_start time,
  hours_full_end time,
  hours_shabbat_start time,
  hours_shabbat_end time,
  owner_user_id uuid not null references users(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index venues_owner_idx on venues(owner_user_id);
create index venues_city_idx on venues(city);

-- ─────────────────────────────────────────────────────────────
-- VENUE IMAGES
-- ─────────────────────────────────────────────────────────────

create table venue_images (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index venue_images_venue_idx on venue_images(venue_id);

-- ─────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete restrict,
  date date not null,
  event_type event_type not null,
  event_purpose event_purpose not null,
  status event_status not null default 'pending',
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  price_listed numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  price_final numeric(10,2) not null default 0,
  notes text,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One event per time slot per venue per date
create unique index events_slot_unique on events(venue_id, date, event_type)
  where status not in ('rejected', 'cancelled');

create index events_venue_date_idx on events(venue_id, date);
create index events_status_idx on events(status);

-- full_day blocks morning and evening on same date
create or replace function check_full_day_conflict()
returns trigger language plpgsql as $$
begin
  -- If inserting a full_day, check no morning/evening exist
  if new.event_type = 'full_day' then
    if exists (
      select 1 from events
      where venue_id = new.venue_id
        and date = new.date
        and event_type in ('morning', 'evening')
        and status not in ('rejected', 'cancelled')
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) then
      raise exception 'Cannot book full_day: morning or evening already exists for this date';
    end if;
  end if;

  -- If inserting morning/evening, check no full_day exists
  if new.event_type in ('morning', 'evening') then
    if exists (
      select 1 from events
      where venue_id = new.venue_id
        and date = new.date
        and event_type = 'full_day'
        and status not in ('rejected', 'cancelled')
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) then
      raise exception 'Cannot book morning/evening: full_day already exists for this date';
    end if;
  end if;

  return new;
end;
$$;

create trigger events_full_day_check
  before insert or update on events
  for each row execute function check_full_day_conflict();

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────────────────────

create table leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  status lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- LEAD ↔ VENUE INTERESTS
-- ─────────────────────────────────────────────────────────────

create table lead_venue_interests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(lead_id, venue_id)
);

-- ─────────────────────────────────────────────────────────────
-- BOOKING LOCKS (conflict prevention)
-- ─────────────────────────────────────────────────────────────

create table booking_locks (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  date date not null,
  event_type event_type not null,
  locked_by_user_id uuid not null references users(id) on delete cascade,
  locked_until timestamptz not null,
  created_at timestamptz not null default now(),
  unique(venue_id, date, event_type)
);

-- ─────────────────────────────────────────────────────────────
-- EMAIL LOGS
-- ─────────────────────────────────────────────────────────────

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  recipient_email text not null,
  email_type email_type not null,
  sent_at timestamptz not null default now(),
  status email_status not null default 'sent'
);

-- ─────────────────────────────────────────────────────────────
-- WAITLIST (scaffold for future use)
-- ─────────────────────────────────────────────────────────────

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  requested_date date not null,
  created_at timestamptz not null default now(),
  unique(lead_id, venue_id, requested_date)
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table users enable row level security;
alter table venues enable row level security;
alter table venue_images enable row level security;
alter table events enable row level security;
alter table leads enable row level security;
alter table lead_venue_interests enable row level security;
alter table booking_locks enable row level security;
alter table email_logs enable row level security;
alter table waitlist enable row level security;

-- Helper: get the current user's role
create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from public.users where id = auth.uid()
$$;

-- Helper: get the current user's venue IDs (for venue_owner)
create or replace function user_venue_ids()
returns setof uuid language sql security definer stable as $$
  select id from public.venues where owner_user_id = auth.uid()
$$;

-- ── users ──
create policy "users_select_own" on users
  for select using (id = auth.uid() or current_user_role() = 'admin');

create policy "users_update_own" on users
  for update using (id = auth.uid() or current_user_role() = 'admin');

create policy "users_insert_admin" on users
  for insert with check (current_user_role() = 'admin');

-- ── venues ──
create policy "venues_select" on venues
  for select using (
    current_user_role() in ('admin', 'secretary')
    or owner_user_id = auth.uid()
  );

create policy "venues_insert_admin" on venues
  for insert with check (current_user_role() = 'admin');

create policy "venues_update" on venues
  for update using (
    current_user_role() = 'admin'
    or owner_user_id = auth.uid()
  );

create policy "venues_delete_admin" on venues
  for delete using (current_user_role() = 'admin');

-- ── venue_images ──
create policy "venue_images_select" on venue_images
  for select using (
    current_user_role() in ('admin', 'secretary')
    or venue_id in (select user_venue_ids())
  );

create policy "venue_images_insert" on venue_images
  for insert with check (
    current_user_role() = 'admin'
    or venue_id in (select user_venue_ids())
  );

create policy "venue_images_delete" on venue_images
  for delete using (
    current_user_role() = 'admin'
    or venue_id in (select user_venue_ids())
  );

-- ── events ──
create policy "events_select" on events
  for select using (
    current_user_role() in ('admin', 'secretary')
    or venue_id in (select user_venue_ids())
  );

create policy "events_insert" on events
  for insert with check (
    current_user_role() in ('admin', 'secretary')
    or venue_id in (select user_venue_ids())
  );

create policy "events_update" on events
  for update using (
    current_user_role() in ('admin', 'secretary')
    or venue_id in (select user_venue_ids())
  );

-- Only admin can set discount_amount (enforced via application layer too)
create policy "events_delete_admin" on events
  for delete using (current_user_role() = 'admin');

-- ── leads ──
create policy "leads_admin_only" on leads
  for all using (current_user_role() = 'admin');

create policy "lead_venue_interests_admin_only" on lead_venue_interests
  for all using (current_user_role() = 'admin');

-- ── booking_locks ──
create policy "booking_locks_select" on booking_locks
  for select using (current_user_role() in ('admin', 'secretary'));

create policy "booking_locks_insert" on booking_locks
  for insert with check (current_user_role() in ('admin', 'secretary'));

create policy "booking_locks_delete" on booking_locks
  for delete using (
    current_user_role() = 'admin'
    or locked_by_user_id = auth.uid()
  );

-- ── email_logs ──
create policy "email_logs_admin" on email_logs
  for all using (current_user_role() = 'admin');

-- ── waitlist ──
create policy "waitlist_admin" on waitlist
  for all using (current_user_role() = 'admin');
