# 02 · PRD

**Milestone.** CP-M2 · Sep 27
**Status.** Draft
**Author.** Tommy Brown
**Input.** [`01-concept-brief.md`](01-concept-brief.md), [`backlog.md`](backlog.md), [`research/`](research/)

## Overview

PetPro OS is a web application and central portal that runs the business side of an independent
dog trainer's or groomer's day. Clients book online, an AI receptionist turns missed calls and
Instagram DMs into confirmed appointments, automated texts cut no-shows, and clients are nudged
to rebook on their grooming cycle or through a training package. It is sold to the owner-operator
on a flat monthly subscription and is designed to be acquired at scale through Meta ads with a
single irresistible promise: *we'll get you more bookings and run your operations for you.*

The wedge is that most of these owners have almost no digital infrastructure. They run on
back-and-forth texts, DMs, phone tag, and a paper book. PetPro OS is built to remove that
communication work, not to make them learn yet another app.

Every requirement traces to a backlog story (S1–S10 in [`backlog.md`](backlog.md)) so
engineering, QA, and tests share one reference.

## Problem definition

**What is the problem?**
Independent trainers and groomers have no digital infrastructure to scale. Booking, rescheduling,
reminders, and rebooking all happen through manual back-and-forth: a text here, a DM there, a
missed call, a note in a book. It's slow, it drops leads, and it caps how big the business can
get because the owner is the bottleneck for every message.

**Who is facing the problem?**
Solo (or 2–4 person) dog trainers and groomers with little to no software. Many are older,
have run the business for years on a notebook and a phone, know they're leaving money on the
table, and don't know how to take the business to the next level or where to start with tech.

**Business value unlocked**
- Decreased time spent on admin and messaging.
- Automatic booking (self-serve + AI-captured from calls/DMs).
- Automatic retainers/rebooking that bring clients back on cycle.
- Better client experience and a professional image.
- Reduced "customer support" load (fewer calls/texts the owner personally answers).
- More data: one central portal with clients, dogs, revenue, and history.

**How will the target users benefit if the problem is solved?**
- They stop losing money to no-shows and unreturned messages, because the system answers and
  books 24/7 even while they're working with a dog.
- Their calendar fills itself: freed slots get filled from a waitlist, and past clients get
  auto-nudged to rebook on their grooming cadence.
- They look bigger and more professional than competitors still working out of a notebook,
  which wins premium clients and referrals.
- They finally *see* their business, revenue, retention, no-show rate in one place, and can grow
  without hiring a front desk.
- They get their time back to do the work they actually love.

**Why is it urgent now?**
Owners are more open to tech than ever, especially with AI, but they don't know where to start.
Whoever gives them a dead-simple, done-for-you on-ramp right now wins the relationship before the
incumbents reach down-market.

## Go-to-market: the offer

The Meta ad hook, aimed straight at trainers/groomers:
> "What if I could increase your bookings **and** hand you a portal that runs your scheduling,
> reminders, and rebooking for you, all in one?"

This reframes PetPro OS from "software you buy" to "growth you get." The ad promises more
bookings; the product delivers the bookings *and* the operating system to handle them. Funnel:
Meta ad → landing page (the promise + proof) → lead form or booked demo → done-for-you setup →
paid subscription. Meta Pixel + Conversions API prove which ad dollars became paying owners.

## Goals

**Primary goal**
- Remove the manual back-and-forth: capture and book appointments automatically, cut no-shows,
  and auto-rebook, so an owner can grow without a front desk, and prove it's sellable via Meta.

**Secondary goals**
- Same-day activation for non-technical owners (done-for-you setup, import their contacts).
- Give trainers a reason to stay (visible session progress) and groomers a reason to stay
  (auto-rebooking that fills the calendar).

**Non-goals (explicit)**
- No facility/enterprise features (boarding, daycare, kennel, multi-location chains).
- No consumer marketplace, and no taking a % of the owner's revenue (flat subscription only).
- No native mobile app this semester (mobile web + SMS only).
- No veterinary/medical records or health-regulated data.

## Success metrics (what we track)

| Metric | Type | Baseline | Target | Window |
| --- | --- | --- | --- | --- |
| No-show rate for reminded bookings | North Star | ~10% industry | ≤5% | 30 days post-activation |
| Bookings captured automatically (self-serve + AI) | Product | 0% (manual) | ≥70% | 30 days |
| Time to first real booking after signup | Activation | n/a | <24 hours | per account |
| Missed-call/DM → booked conversion | Product | ~0 (lost) | ≥30% of inbound | 30 days |
| Rebooking rate (grooming) | Retention | ad hoc | ≥40% auto-rebooked | 60 days |
| Revenue recovered per account (no-shows + rebooks + waitlist) | Value proof | n/a | show $ monthly | ongoing |
| Meta CAC / payback | Business | n/a | ≤$200 CAC, ≤4-mo payback | per cohort |
| Guardrail: SMS delivery success | Tech health | n/a | ≥98% | ongoing |

## User personas

**Sandy, 58, groomer of 25 years (small shop).** Runs everything from a spiral notebook and her
cell. Full grooms every 4–8 weeks. Pain: misses calls while grooming, forgets to remind clients,
never nudges rebooks, "not a computer person." She needs it to just work over text.

**Dana, 34, independent dog trainer.** Private + in-home lessons and board-and-train, booked over
Instagram DMs, progress in a spreadsheet. Pain: evenings lost to admin; clients drop mid-package
because they can't "see" progress; generic tools don't do packages or notes.

**Marcus, 41, mobile groomer.** Books by phone/text between stops. Pain: no-shows waste a whole
slot and a drive; MoeGo is too complex and charges per van with metered texts.

**Secondary actor — the pet owner (end client).** Books online or via a text/DM, gets reminders,
leaves reviews. Not the buyer, but their experience drives the owner's willingness to pay.

## Core features

1. **Self-serve booking (S1)** — services by type (grooming/training) and size/duration, each
   with price and optional deposit; a booking link for the Instagram bio; real-time availability;
   instant confirmations.
2. **AI receptionist / message-to-booking (new, differentiator)** — a business number + IG DM
   connection where an AI answers common questions (price, availability, services), captures
   missed calls as texts, and books the appointment in a natural two-way conversation. This is
   the direct fix for "everything is back-and-forth."
3. **Automated SMS reminders (S2)** — 24h reminder with cancel/reschedule link; cancel reopens
   the slot and notifies the owner; every send + outcome logged.
4. **Owner dashboard + "Revenue Recovered" (S3, new)** — today/this-week view with empty and
   error states, plus a running tally of money saved from prevented no-shows, filled waitlist
   slots, and auto-rebookings, so the ROI is undeniable.
5. **SMS consent capture (S4)** — explicit, timestamped opt-in; no consent, no texts.
6. **Auto-rebooking on cadence (S5)** — per-service rebook cycle; one nudge with a link;
   suppressed if a future appointment exists.
7. **Reputation autopilot (S6)** — post-visit review request with a direct link; AI can draft
   review replies for the owner to approve.
8. **Client/dog records + session notes (S7)** — notes/homework per session, viewable by the
   client via a private link (no app), the training wedge.
9. **Waitlist auto-fill (S8)** — freed slots offered to the next waitlisted client by SMS with a
   claim window.
10. **Meta attribution (S9)** — every booking carries a source and can fire a Meta conversion
    event.
11. **Payments: packages & deposits (S10)** — deposits and multi-session packages through the
    owner's own Stripe.

**Scope by release**
- **MVP (P0):** S1, S2, S3, S4 — book → confirm → remind → owner sees it.
- **Fast-follow (P1):** AI receptionist, S5, S6, S7.
- **Later (P2):** S8, S9, S10.

## What makes it irresistible (differentiators)

- **Done-for-you setup for non-techy owners.** Import contacts/clients from a spreadsheet or
  phone, and the portal + booking page are built in minutes. White-glove/AI-guided onboarding
  removes the "I don't know where to start" barrier.
- **It works over text.** The owner barely touches an app; the system runs on SMS so a
  59-year-old groomer can adopt it in a day.
- **AI receptionist that never misses a lead.** Missed calls and DMs become booked appointments
  automatically, the single biggest source of lost revenue for these businesses.
- **ROI you can see.** The "Revenue Recovered" number turns the subscription into an obvious
  profit, not a cost.
- **Growth, not just software.** The Meta offer brings them clients while the portal runs ops,
  a bundle incumbents don't offer.

## UI / UX

- **Mobile-first, dead simple.** Big touch targets, minimal steps, plain language, no jargon,
  built for someone doing this between dogs. Apple-inspired, calm, premium.
- **Owner app:** a home dashboard (today's schedule, alerts, Revenue Recovered), a tap-to-add
  booking, a client/dog list, and a messages inbox where AI-drafted replies are one tap to send.
- **Client booking page:** branded to the owner, 3 taps to book (service → time → details),
  visible availability, clear consent + deposit steps, confirmation screen.
- **Every screen has an empty state and an error state** (per `CLAUDE.md`).
- **Accessibility:** large fonts, high contrast, SMS fallbacks so the least-technical owner and
  client can still complete every task without the app.

## Payment processing

- Stripe Connect: each owner connects their own Stripe; money lands with them, not the platform.
- Deposits required at booking on selected services (protects high-value slots like
  board-and-train); packages sold as prepaid session bundles.
- Subscriptions (Starter/Pro/Team) billed to the owner via Stripe; failed-payment retries and
  clear dunning.
- No percentage cut of the owner's revenue, ever (the anti-Fresha stance).

## User flow

**Owner side**
1. Clicks a Meta ad → lands on the offer page → books a demo or starts a trial.
2. Done-for-you setup: imports contacts, we generate services, booking page, and reminder
   templates.
3. Connects Stripe and their business phone / IG for the AI receptionist (A2P registration).
4. Shares the booking link; incoming calls/DMs now get answered and booked automatically.
5. Runs the day from the dashboard; approves AI-drafted messages/replies with one tap.
6. Watches Revenue Recovered climb; upgrades tier as they grow.

**Customer (pet owner) side**
1. Finds the business (ad, IG bio link, or texts/DMs the shop).
2. Books via the link, or the AI receptionist books them right in the chat.
3. Enters details + dog, gives SMS consent, pays a deposit if required.
4. Gets a confirmation, then a 24h reminder (cancel reopens the slot).
5. Visit happens; for training, views session notes/homework via a private link.
6. Gets a review request; later gets one rebooking nudge on cycle and books again.

## Database

Postgres (via Supabase) with per-account row-level security. Core entities and relationships:

```
ACCOUNT (owner/business)
- id (PK), business_name, owner_name, email, phone
- plan (enum: starter, pro, team), stripe_account_id, sms_sender_id, timezone
- created_at / updated_at

STAFF
- id (PK), account_id (FK->ACCOUNT), name, role (enum: owner, staff)

SERVICE
- id (PK), account_id (FK->ACCOUNT), name, type (enum: grooming, training)
- size_tier (enum: small, medium, large, xl, na), duration_min, price
- requires_deposit (bool), deposit_amount, rebook_cycle_days (nullable), active (bool)

CLIENT
- id (PK), account_id (FK->ACCOUNT), name, phone, email
- sms_consent (bool), sms_consent_at

DOG
- id (PK), client_id (FK->CLIENT), name, breed, size, notes

BOOKING
- id (PK), account_id (FK->ACCOUNT), client_id (FK->CLIENT), dog_id (FK->DOG)
- service_id (FK->SERVICE), staff_id (FK->STAFF, nullable)
- start_time, end_time
- status (enum: pending, confirmed, completed, cancelled, no_show)
- source (enum: organic, meta, referral, ai_receptionist)

LEAD (from ads / missed calls / DMs)
- id (PK), account_id (FK->ACCOUNT), name, phone, source
- status (enum: new, contacted, booked, lost), created_at

CONVERSATION (AI receptionist thread)
- id (PK), account_id (FK->ACCOUNT), client_id (FK->CLIENT, nullable), lead_id (FK->LEAD, nullable)
- channel (enum: sms, ig_dm), status (enum: open, booked, closed)

MESSAGE
- id (PK), conversation_id (FK->CONVERSATION), direction (enum: inbound, outbound)
- body, ai_generated (bool), created_at

REMINDER
- id (PK), booking_id (FK->BOOKING), channel (enum: sms)
- scheduled_for, sent_at, status (enum: scheduled, sent, failed)
- outcome (enum: confirmed, cancelled, none)

SESSION_NOTE
- id (PK), booking_id (FK->BOOKING), dog_id (FK->DOG), notes, homework, share_token

REVIEW_REQUEST
- id (PK), booking_id (FK->BOOKING), sent_at, review_link, status (enum: pending, sent, reviewed)

PACKAGE
- id (PK), account_id (FK->ACCOUNT), client_id (FK->CLIENT), service_id (FK->SERVICE)
- sessions_total, sessions_used

PAYMENT
- id (PK), account_id (FK->ACCOUNT), client_id (FK->CLIENT)
- booking_id (FK->BOOKING, nullable), package_id (FK->PACKAGE, nullable)
- amount, type (enum: deposit, package, full, subscription)
- stripe_payment_id, status (enum: pending, completed, failed, refunded)

CONVERSION_EVENT
- id (PK), booking_id (FK->BOOKING), source, utm (JSON), meta_event_id, fired_at
```

**Relationships**
- Account has many Staff, Services, Clients, Bookings, Leads, Conversations.
- Client has many Dogs and Bookings; a Conversation belongs to a Client or a Lead and has many
  Messages.
- Booking belongs to Account/Client/Dog/Service (optional Staff); has Reminder(s), optional
  SessionNote, one ReviewRequest, and optional ConversionEvent.
- Package belongs to Client + Service; Payment belongs to Account + Client and optionally a
  Booking or Package.

## Backend

- Supabase (Postgres, Auth, Storage) with row-level security for per-account isolation.
- Service layer for external integrations (Twilio, Stripe, Meta, IG) behind clean interfaces.
- Background job queue for scheduled/idempotent work: reminders, rebooking nudges, review
  requests, waitlist offers, conversion events (n8n and/or Supabase scheduled functions).
- AI layer: an LLM handles receptionist conversations and drafts messages, constrained by the
  owner's services/availability so it can't quote wrong prices or double-book; a human-approval
  option gates anything sensitive.
- Webhooks: Twilio inbound SMS, Stripe payment status, Meta/IG messaging.
- Logging + alerting on delivery failures and job errors.

## Frontend

- Next.js / React / Tailwind, mobile-first, server-rendered for fast loads.
- Owner app (dashboard, bookings, clients/dogs, inbox, settings) and a branded public booking
  page as separate route groups.
- Component library with built-in empty/error/loading states.
- Real-time updates on the dashboard (new bookings, inbound messages) via Supabase subscriptions.
- Meta Pixel on public pages; accessible, large-touch UI for low-tech users.

## API integration points

- **Twilio** — reminders, nudges, review requests, two-way AI receptionist SMS, missed-call
  capture; A2P 10DLC registration.
- **Instagram / Messenger** — receive and reply to DMs for the AI receptionist.
- **Stripe Connect** — deposits, packages, subscriptions; webhooks for status.
- **Meta Conversions API** — fire booking/lead conversion events for ad optimization.
- **LLM provider** — receptionist conversations and message drafting.
- **Calendar (optional)** — Google Calendar sync to block personal time.

## Technical requirements

1. Booking must show real availability and prevent double-booking. Why? A confirmed-but-taken
   slot destroys trust on day one. (S1) — Frontend, Backend/DB
2. AI receptionist must be grounded in the owner's live services/availability and never confirm a
   slot it can't hold. Why? Wrong prices or double-books burn trust fast. (new) — AI, Backend
3. Reminders/nudges run as idempotent scheduled jobs. Why? Fire once, on time, across restarts;
   duplicates annoy clients. (S2, S5) — Job queue, Twilio
4. SMS consent stored with timestamp + wording and enforced before any send; honor STOP. Why?
   Legal (TCPA / A2P 10DLC) and ethical. (S4) — Backend, Compliance
5. Deposits/packages/subscriptions run through the owner's connected Stripe. Why? Money lands
   with the owner; avoids platform liability. (S10) — Stripe Connect
6. Every booking records a source and can fire a Meta conversion event. Why? Attribution is
   required to optimize spend and prove the funnel. (S9) — Backend, Meta CAPI
7. Session notes shareable via tokenized link, no client login. Why? Friction kills engagement.
   (S7) — Frontend, Backend
8. Every view has explicit empty and error states. Why? Blank/broken reads as "it failed."
   (S3, per `CLAUDE.md`) — Frontend

## Non-functional requirements

- **Security:** auth/authorization, per-account row-level security, secret storage, input
  validation, expiring tokenized links.
- **Compliance:** SMS consent + STOP handling, A2P 10DLC, owner-owned payment data.
- **Performance:** booking page p95 < 2s on mobile; reminder dispatch within 1 min of schedule.
- **Reliability:** ≥98% SMS delivery; jobs retry with alerting.

## Pricing (business model)

Flat, feature-gated tiers; no per-seat/per-van; texts included (fair-use cap); owner connects
their own Stripe.

| Plan | $/mo flat | Adds |
| --- | --- | --- |
| Starter | 29 | booking, reminders, reviews, fair-use texts |
| Pro (hero) | 49 | + AI receptionist, rebooking automation, packages, waitlist, session notes, Meta attribution |
| Team | 99 | + multiple calendars, no per-seat trap |

## Risks and open questions

- Grooming is contested (MoeGo). Mitigation: lead with training + the AI-receptionist and
  flat-price/unlimited-text wedge, not feature parity.
- AI receptionist accuracy and IG messaging API access/limits.
- Distribution: need real pet-pro interviews and early customers to seed Meta lookalikes (first
  discovery outreach in progress with a local trainer, Cohesive Canine Training).
- Open: product name; exact per-tier feature split; training-led vs. co-equal launch.

## Dependent stakeholders

- Twilio (A2P 10DLC approval, external gating step), Stripe (Connect onboarding), Meta (business
  verification + ad account + messaging permissions), and early pilot pros for validation.

## Next

CP-M3 · Architecture · Oct 11 — [`docs/03-architecture.md`](03-architecture.md)
