# Grand Prix scheduler — backend lessons

**Date.** Sep 17, 2026
**Code.** `/Users/tombro/grand-pit-scheduler` (not this repo)
**Why it’s here.** Prototype of a booking admin. Do not clone its schema mistakes into the capstone.

## What it is

Vite/React talking to Supabase project `nigbwqtpgrpjayzcbhqx`. No standalone API. PostgREST + RLS, Edge Functions (service role), a few RPCs. GHL for CRM. Stripe columns exist; checkout is mock.

## Three booking systems

| Path | Table | Writer | Readers |
|------|--------|--------|---------|
| Website wizard `/book` | `bookings` | `secure-booking` | Dashboard, payments, customer portal |
| Resource appointments | `appointments` | `rpc_create_booking` (unused by UI) | Admin Bookings/Schedule, clear-* tools |
| `/book-detailing` | `detailing_bookings` | Client insert | Detailing admin (not in sidebar) |

Website bookings do not show on Admin Bookings. Clear-all deletes `appointments` only.

## Admin portal (real vs fake)

**Live:** Dashboard (`bookings`), Bookings list (`appointments`), customers, payments (derived), GHL mappings, create-user, detailing page.

**Placeholder:** Analytics (+23%, $127, 89%), Resources (8 bays / 12 staff), Settings.

**Broken in working tree:** Calendar treats `getAppointments()` as an array after it started returning `{appointments,total}`. Schedule reads `starts_at` while API sends `date`/`time`.

## Protections

RLS + `get_user_role()` is real. `create-admin-user` and clear-* check admin JWT. Almost all functions have `verify_jwt = false`. Rate limit 5/15 min on customer auth only; fails open. CORS `*`. Seeded `TestAdmin123!` in migrations. `customers.password_hash` unused.

## Pricing / scheduling (auto spa)

Quote = midpoint of size range + 8.75% tax + deposit. Size enums don’t match (`xl` vs `xlarge`). Capacity: 7 details/day, 1 PPF/ceramic per 3-day window — wizard often doesn’t pass `service_name`. Blackouts/locks unused. GHL calendar sync unused; webhook after checkout is used.

## Do not copy

- Dual/triple booking tables
- Fake Stripe
- Relative `fetch('/functions/v1/...')` without the functions host
- Hardcoded single-tenant catalog
- Advertising this app as the nationwide product

## Do copy as ideas

- Service families / packages / duration
- Deposit vs balance
- Admin IA: bookings, schedule, customers, payments
- Edge functions for privileged writes

Capstone architecture: [`../03-architecture.md`](../03-architecture.md)
