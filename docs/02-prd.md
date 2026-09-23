# 02 · PRD

**Milestone.** CP-M2 · Sep 27
**Status.** Draft
**Author.** Tommy Brown
**Input.** [`01-concept-brief.md`](01-concept-brief.md), [`backlog.md`](backlog.md), [`research/`](research/)

## Overview

PetPro OS is a web application that lets an independent dog trainer or groomer run the business
side of their day: clients book online, automated texts cut no-shows, and clients are nudged to
rebook on their grooming cycle or through a training package. It is sold to the owner-operator
(not the pet owner) on a flat monthly subscription, and it is designed to be acquired at scale
through Meta ads. The wedge is simplicity and a flat price for solo pros, plus a training-first
feature (session notes the client can see) that the incumbents ignore.

Each requirement traces to a backlog story (S1–S10 in [`backlog.md`](backlog.md)) so engineering,
QA, and tests share one reference.

## Problem definition

**What is the problem?**
Independent pet pros run on scattered tools (calls, DMs, Google Calendar, Square, a paper book).
No-shows and unfilled slots bleed real money ($40–$140 per groom, $75–$250 per training
session), rebooking only happens when the owner remembers to ask, and existing software is
either built for facilities (too heavy/expensive for a solo shop) or ignores trainers entirely.

**Who is facing it?**
Solo (or 2–4 person) dog trainers and groomers who do the work themselves and manage the
business from their phone between appointments.

**Business value unlocked**
1. Recurring revenue: a flat $29–$99/mo subscription with grooming's 4–8-week rebooking cadence
   driving high retention.
2. Cheap, scalable acquisition: a working product + funnel that Meta can sell to owners at a
   proven ~$150 SMB-SaaS CAC, giving ~3-month payback at the $49 tier.
3. A defensible wedge in an open market (training) rather than a feature war with MoeGo.

**How target users benefit**
Fewer no-shows, a full calendar without a front desk, automatic rebooking, and a professional
booking experience that wins premium clients.

**Why now?**
Training software is a genuinely open market, solo groomers are underserved on price by
incumbents, and AI-assisted build (Cursor) plus a proven Meta funnel make a solo launch viable.

## Goals

**Primary goal**
- Cut no-shows and keep calendars full for independent pet pros, and prove the product can be
  sold profitably through Meta ads.

**Secondary goals**
- Make onboarding fast enough that a solo pro is live and taking a real booking the same day.
- Give trainers a reason to stay (visible progress/session notes) beyond just scheduling.

**Non-goals (explicit)**
- No facility/enterprise features (boarding, daycare, kennel, multi-location chains).
- No consumer marketplace, and no taking a % of the pro's revenue (flat subscription only).
- No native mobile app this semester (mobile web only).
- No veterinary/medical records or health-regulated data.

## Success metrics

| Metric | Type | Baseline | Target | Window |
| --- | --- | --- | --- | --- |
| No-show rate for reminded bookings | North Star (customer) | ~10% industry | ≤5% | 30 days post-activation |
| Time to first real booking after signup | Activation | n/a | < 24 hours | per new account |
| % bookings that are client self-served | Product | 0% (manual today) | ≥ 70% | 30 days |
| Rebooking rate (grooming clients) | Retention | manual/ad hoc | ≥ 40% auto-rebooked | 60 days |
| Meta CAC / payback | Business | n/a | ≤ $200 CAC, ≤ 4-mo payback | per cohort |
| Guardrail: SMS delivery success | Tech health | n/a | ≥ 98% | ongoing |

## User personas

**Dana, 34, independent dog trainer (Syracuse).** Runs private and in-home lessons plus a
board-and-train. Books over calls and Instagram DMs, tracks progress in a spreadsheet.
Pain points:
- Loses evenings to admin and manual reminder texts.
- Clients drop off mid-package because they can't "see" progress.
- Generic tools (Acuity/Square) don't handle packages, session notes, or homework.

**Marcus, 41, solo groomer (mobile + small shop).** Full grooms every 4–8 weeks per dog.
Pain points:
- No-shows and last-minute cancels cost a whole appointment slot.
- Forgets to nudge clients to rebook, so the calendar has holes.
- MoeGo-class tools are too complex and charge per van with metered texts.

**Secondary actor — the pet owner (end client).** Books online, gets reminders, leaves reviews.
Not the buyer, but their experience drives the owner's willingness to pay.

## Core features

1. **Self-serve booking (S1)**
   - Services defined by type (grooming/training) and size/duration (e.g. full groom – large,
     private lesson – 1hr), each with price and optional deposit.
   - Public booking page/link for the owner's Instagram bio; real-time availability.
   - Instant confirmation to client and owner.
2. **Automated SMS reminders (S2)**
   - 24h reminder with time, service, and a cancel/reschedule link.
   - Cancel reopens the slot and notifies the owner; every send + outcome logged.
3. **Owner dashboard (S3)**
   - Today/this-week view (client, dog, service, time), with explicit empty and error states.
4. **SMS consent capture (S4)**
   - Explicit, timestamped opt-in at booking; non-consenting clients receive no texts.
5. **Rebooking on cadence (S5)** — grooming retention engine
   - Per-service rebook cycle (e.g. 6 weeks); one nudge with a booking link; suppressed if a
     future appointment already exists.
6. **Automated review requests (S6)**
   - One post-visit review request with a direct link; not re-sent to clients who reviewed.
7. **Client/dog records + session notes (S7)** — training wedge
   - Notes and homework logged per session, viewable by the client via a private link (no app).
8. **Waitlist auto-fill (S8)** · **Meta attribution (S9)** · **Packages & deposits (S10)**
   - Waitlist claims freed slots; bookings carry a source and fire a Meta conversion event;
     packages and deposits collected through the owner's Stripe.

**Scope by release**
- **MVP (P0):** S1, S2, S3, S4 — book → confirm → remind → owner sees it.
- **Fast-follow (P1):** S5, S6, S7.
- **Later (P2):** S8, S9, S10.

## User flow

**Flow A — Owner onboarding (same-day live)**
1. Owner signs up and starts a 14-day trial; picks a plan (Starter/Pro/Team).
2. Connects their own Stripe account (for deposits/packages).
3. Adds services: type, size/duration, price, optional deposit, rebook cycle.
4. Sets working hours/availability and their SMS sender (A2P registration).
5. Gets a booking link and adds it to their Instagram bio / website.

**Flow B — Client booking to rebooking**
1. Client taps the booking link (often from Instagram).
2. Selects a service (grooming size or training type) and an open slot.
3. Enters their details + dog, gives SMS consent, and pays a deposit if required.
4. Receives a confirmation; the booking appears on the owner's dashboard.
5. 24h before, the client gets an SMS reminder (cancel reopens the slot + notifies owner).
6. Visit happens; owner marks it complete and, for training, logs session notes/homework.
7. Client gets a review request; for training they can view progress via a private link.
8. At the service's rebook cycle, the client gets one rebooking nudge and books again.

## Entity relationship diagram (ERD)

```
ACCOUNT (the pet-pro business / owner)
- id (PK)
- business_name
- owner_name
- email
- phone
- plan (enum: starter, pro, team)
- stripe_account_id
- sms_sender_id
- timezone
- created_at / updated_at

STAFF (Team tier; owner is default staff)
- id (PK)
- account_id (FK -> ACCOUNT.id)
- name
- role (enum: owner, staff)
- created_at / updated_at

SERVICE
- id (PK)
- account_id (FK -> ACCOUNT.id)
- name
- type (enum: grooming, training)
- size_tier (enum: small, medium, large, xl, na)
- duration_min
- price
- requires_deposit (bool)
- deposit_amount
- rebook_cycle_days (nullable)
- active (bool)
- created_at / updated_at

CLIENT
- id (PK)
- account_id (FK -> ACCOUNT.id)
- name
- phone
- email
- sms_consent (bool)
- sms_consent_at
- created_at / updated_at

DOG
- id (PK)
- client_id (FK -> CLIENT.id)
- name
- breed
- size
- notes
- created_at / updated_at

BOOKING
- id (PK)
- account_id (FK -> ACCOUNT.id)
- client_id (FK -> CLIENT.id)
- dog_id (FK -> DOG.id)
- service_id (FK -> SERVICE.id)
- staff_id (FK -> STAFF.id, nullable)
- start_time / end_time
- status (enum: pending, confirmed, completed, cancelled, no_show)
- source (enum: organic, meta, referral)
- created_at / updated_at

REMINDER
- id (PK)
- booking_id (FK -> BOOKING.id)
- channel (enum: sms)
- scheduled_for
- sent_at
- status (enum: scheduled, sent, failed)
- outcome (enum: confirmed, cancelled, none)

SESSION_NOTE (training)
- id (PK)
- booking_id (FK -> BOOKING.id)
- dog_id (FK -> DOG.id)
- notes
- homework
- share_token
- created_at / updated_at

REVIEW_REQUEST
- id (PK)
- booking_id (FK -> BOOKING.id)
- sent_at
- review_link
- status (enum: pending, sent, reviewed)

PACKAGE
- id (PK)
- account_id (FK -> ACCOUNT.id)
- client_id (FK -> CLIENT.id)
- service_id (FK -> SERVICE.id)
- sessions_total / sessions_used
- created_at / updated_at

PAYMENT
- id (PK)
- account_id (FK -> ACCOUNT.id)
- client_id (FK -> CLIENT.id)
- booking_id (FK -> BOOKING.id, nullable)
- package_id (FK -> PACKAGE.id, nullable)
- amount
- type (enum: deposit, package, full)
- stripe_payment_id
- status (enum: pending, completed, failed, refunded)

CONVERSION_EVENT (Meta attribution)
- id (PK)
- booking_id (FK -> BOOKING.id)
- source
- utm (JSON)
- meta_event_id
- fired_at
```

**Relationships**
- An Account has many Staff, Services, Clients, and Bookings.
- A Client has many Dogs; a Client has many Bookings.
- A Booking belongs to an Account, Client, Dog, and Service (optionally a Staff).
- A Booking has one Reminder (or a scheduled set), optionally one SessionNote, and one
  ReviewRequest.
- A Package belongs to a Client and a Service; a Payment belongs to an Account and a Client and
  optionally a Booking or Package.
- A ConversionEvent belongs to a Booking.

## Technical requirements

1. **Booking page must show real availability and prevent double-booking.**
   Why? A confirmed slot that's actually taken destroys trust on day one. (S1)
   Component: Frontend, Backend/DB
2. **Reminders run as scheduled background jobs, idempotently.**
   Why? Reminders must fire once, on time, even across restarts; duplicates annoy clients. (S2)
   Component: Backend job queue, Twilio
3. **SMS consent is stored with timestamp + wording and enforced before any send.**
   Why? Legal requirement (TCPA / Twilio A2P 10DLC); also the ethical baseline. (S4)
   Component: Backend/DB, Compliance
4. **Deposits/packages are charged through the owner's connected Stripe account.**
   Why? Money must land with the owner, not the platform; builds trust and avoids liability. (S10)
   Component: Stripe Connect, Backend
5. **Every booking records a source and can fire a Meta Conversions API event.**
   Why? Attribution is required to optimize ad spend and prove the funnel works. (S9)
   Component: Backend, Meta CAPI
6. **Session notes are shareable via a private, tokenized link with no login for the client.**
   Why? Friction kills engagement; owners want clients to actually read homework. (S7)
   Component: Frontend, Backend
7. **All list/detail views have explicit empty and error states.**
   Why? A blank or broken screen reads as "the software failed." (S3, per `CLAUDE.md`)
   Component: Frontend

## Technology stack

- Frontend: Next.js / React / Tailwind (mobile-first).
- Backend + DB: Supabase (Postgres, auth, storage).
- SMS: Twilio (with A2P 10DLC registration).
- Payments: Stripe Connect (owner-owned accounts).
- Automations/jobs: n8n and/or Supabase scheduled functions.
- Analytics/ads: Meta Pixel + Conversions API.
- Hosting: Vercel. Built with Cursor.

(Stack is a proposal; CP-M3 makes the final call.)

## API integration points

- **Twilio** — send reminders/nudges/review requests; inbound webhooks for cancel/confirm
  replies; A2P registration.
- **Stripe Connect** — deposits, packages, subscriptions; webhooks for payment status.
- **Meta Conversions API** — fire booking/lead conversion events for ad optimization.
- **Calendar (optional)** — Google Calendar sync to block personal time.

## Non-functional requirements

- **Security:** authentication/authorization, per-account data isolation (row-level security),
  secure secret storage, input validation, tokenized share links that expire.
- **Compliance:** SMS consent + STOP/opt-out handling; A2P 10DLC; owner-owned payment data.
- **Performance:** booking page loads fast on mobile (p95 < 2s); reminder jobs dispatch within
  1 minute of schedule.
- **Reliability:** ≥ 98% SMS delivery success; jobs retry on failure with alerting.

## Pricing (business model)

Flat, feature-gated tiers; no per-seat/per-van; texts included (fair-use cap to protect margin);
owner connects their own Stripe.

| Plan | $/mo flat | Adds |
| --- | --- | --- |
| Starter | 29 | booking, reminders, reviews, fair-use texts |
| Pro (hero) | 49 | + rebooking automation, packages, waitlist, session notes, Meta attribution |
| Team | 99 | + multiple calendars, no per-seat trap |

## Key metrics (funnel)

- **North Star:** no-show rate for reminded bookings (target ≤ 5%).
- **Awareness:** Meta ad CTR, cost per landing-page view.
- **Adoption:** signups → activated (first real booking < 24h) rate.
- **Retention:** grooming rebooking rate; monthly logo churn.
- **Business:** CAC, LTV:CAC, payback period.
- **Tech health:** SMS delivery success, reminder dispatch latency, uptime.

## Risks and open questions

- Grooming is contested (MoeGo). Mitigation: lead with training + solo/flat-price/unlimited-text
  wedge, not feature parity.
- Distribution: need real pet-pro interviews and early customers to seed Meta lookalikes (first
  discovery call in progress with a local trainer).
- Open: product name; exact feature split per tier; training-led vs. co-equal launch; Google
  Calendar as source of truth vs. built-in.

## Dependent stakeholders

- Twilio (A2P 10DLC approval — external gating step before SMS features are live).
- Stripe (Connect onboarding for owners).
- Meta (Business verification + ad account for the acquisition funnel).
- Early pilot pros (Cohesive Canine Training and others) for discovery and validation.

## Next

CP-M3 · Architecture · Oct 11 — [`docs/03-architecture.md`](03-architecture.md)
