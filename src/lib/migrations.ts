// Ordered schema migrations. Append new entries; never edit an applied one.
export const migrations: { id: string; sql: string }[] = [
  {
    id: "0001_init",
    sql: `
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text,
  plan text NOT NULL DEFAULT 'pro',
  status text NOT NULL DEFAULT 'active',          -- active | offboarded
  timezone text NOT NULL DEFAULT 'America/New_York',
  booking_interval_min int,                       -- required before go-live
  operating_hours jsonb,                          -- {"1":["09:00","17:00"], ...} keyed by weekday 0=Sun
  buffer_minutes int NOT NULL DEFAULT 0,
  cancel_cutoff_hours int NOT NULL DEFAULT 24,    -- clients cannot self-cancel inside this window
  deposit_policy text,
  refund_policy text,
  cancellation_policy text,
  default_rebook_days int,
  review_link text,
  contact_link text,                              -- human contact path for SMS fallback
  meta_pixel_id text,
  processor text,                                 -- stripe | square (client payments, not the SaaS bill)
  twilio_subaccount_sid text,
  twilio_from_number text,
  offboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',             -- owner | staff
  working_hours jsonb,                            -- null = use account operating hours
  buffer_minutes int,                             -- null = use account buffer
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL UNIQUE REFERENCES staff(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  external_calendar_id text NOT NULL DEFAULT 'primary',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  sync_state text NOT NULL DEFAULT 'ok',          -- ok | error
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,                             -- grooming | training
  size_tier text,
  duration_min int NOT NULL,
  price_cents int NOT NULL DEFAULT 0,
  requires_deposit boolean NOT NULL DEFAULT false,
  deposit_cents int NOT NULL DEFAULT 0,
  rebook_cycle_days int,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_e164 text NOT NULL,
  email text,
  sms_consent boolean NOT NULL DEFAULT false,
  sms_consent_at timestamptz,
  sms_consent_text text,
  sms_opted_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, phone_e164)                 -- Decision #23: dedupe per account only
);

CREATE TABLE dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text,
  size text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  dog_id uuid REFERENCES dogs(id),
  service_id uuid NOT NULL REFERENCES services(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',       -- pending | confirmed | completed | cancelled | no_show
  source text NOT NULL DEFAULT 'organic',         -- organic | meta | referral | rebook | owner
  price_cents int NOT NULL DEFAULT 0,
  manage_token text NOT NULL UNIQUE,
  external_event_id text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Decision #19: no hold step; a colliding confirm for the same staff + start fails at write time.
CREATE UNIQUE INDEX bookings_staff_slot_uniq ON bookings (staff_id, start_time) WHERE status <> 'cancelled';
CREATE INDEX bookings_account_start ON bookings (account_id, start_time);

CREATE TABLE session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id),
  notes text,
  homework text,
  share_token text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduled, idempotent work: confirmations, 24h reminders, rebook nudges, review requests.
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  kind text NOT NULL,                             -- confirmation | reminder | rebook | review | notes_link
  run_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',         -- pending | running | sent | skipped | failed | cancelled
  outcome text,                                   -- reminder: confirmed | cancelled | none | fallback
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  locked_at timestamptz,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, kind)                       -- one of each kind per booking
);
CREATE INDEX jobs_due ON jobs (status, run_at);

-- Every SMS in and out, with its outcome.
CREATE TABLE sms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  direction text NOT NULL,                        -- out | in
  to_number text,
  from_number text,
  body text NOT NULL,
  status text NOT NULL,                           -- sent | simulated | failed | received
  provider_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sms_log_account ON sms_log (account_id, created_at DESC);
`,
  },
  {
    id: "0002_booking_window",
    sql: `
-- Owner-set self-serve booking window. The minimum can be raised but never below 24h (Decision #7).
ALTER TABLE accounts
  ADD COLUMN min_notice_hours int NOT NULL DEFAULT 24 CHECK (min_notice_hours >= 24),
  ADD COLUMN max_advance_days int NOT NULL DEFAULT 60 CHECK (max_advance_days BETWEEN 1 AND 365);
`,
  },
];
