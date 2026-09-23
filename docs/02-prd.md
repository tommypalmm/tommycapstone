# 02 · PRD

**Milestone.** CP-M2 · Sep 27
**Status.** Draft
**Author.** Tommy Brown
**Working title.** TBD (candidates: Fetch, Pawtal, Houndly, Groomly, Heel). Referred to below as
"the platform."
**Input.** [`01-concept-brief.md`](01-concept-brief.md), [`backlog.md`](backlog.md), [`research/`](research/)

## Overview

The platform is a web application and central portal that runs the business side of an independent
dog trainer's or groomer's day. Clients book online through a page the owner can embed on their
own website or share as a link, automated texts cut no-shows, and past clients are nudged to
rebook on their grooming cycle or through a training package. It is sold to the owner-operator on
a flat monthly subscription and is designed to be acquired at scale through Meta ads with a single
promise: *we'll get you more bookings and run your operations for you.*

The wedge is that most of these owners have almost no digital infrastructure. They run on
back-and-forth texts, phone tag, and a paper book. The platform is built to remove that
communication work, not to make them learn yet another app.

Every requirement traces to a backlog story (S1–S10 in [`backlog.md`](backlog.md)) so
engineering, QA, and tests share one reference.

## Problem definition

**What is the problem?**
Independent trainers and groomers have no digital infrastructure to scale. Booking, rescheduling,
reminders, and rebooking all happen through manual back-and-forth: a text here, a missed call, a
note in a book. It's slow, it drops leads, and it caps how big the business can get because the
owner is the bottleneck for every message.

**Who is facing the problem?**
Solo (or 2–4 person) dog trainers and groomers with little to no software. Many are older, have
run the business for years on a notebook and a phone, know they're leaving money on the table,
and don't know how to take the business to the next level or where to start with tech.

**Business value unlocked**
- Decreased time spent on admin and messaging.
- Automatic booking (self-serve on the owner's site or link).
- Automatic retainers/rebooking that bring clients back on cycle.
- Better client experience and a more professional image.
- Reduced "customer support" load (fewer calls/texts the owner personally answers).
- More data: one central portal with clients, dogs, revenue, and history.

**How will the target users benefit if the problem is solved?**
- They stop losing money to no-shows and unreturned messages, because the booking page works
  24/7 while they're with a dog.
- Their calendar fills itself: freed slots get filled from a waitlist, and past clients get
  auto-nudged to rebook on their grooming cadence.
- They look bigger and more professional than competitors still working out of a notebook.
- They finally see their business, revenue, retention, no-show rate, in one place, and can grow
  without hiring a front desk.
- They get their time back to do the work they actually love.

**Why is it urgent now?**
Owners are more open to tech than ever, especially with AI, but they don't know where to start.
Whoever gives them a dead-simple, done-for-you on-ramp now wins the relationship before the
incumbents reach down-market.

## Go-to-market: the offer

The Meta ad hook, aimed straight at trainers/groomers:
> "What if I could increase your bookings **and** hand you a portal that runs your scheduling,
> reminders, and rebooking for you, all in one?"

This reframes the platform from "software you buy" to "growth you get." Funnel: Meta ad → landing
page (the promise + proof) → lead form or booked demo → done-for-you setup → paid subscription.
Meta Pixel + Conversions API show which ad dollars became paying owners.

## Goals

**Primary goal**
- Remove the manual back-and-forth: let clients book themselves, cut no-shows with automatic
  texts, and auto-rebook, so an owner can grow without a front desk, and prove it's sellable via
  Meta.

**Secondary goals**
- Same-day activation for non-technical owners (done-for-you setup, import their contacts).
- Give trainers a reason to stay (visible session progress) and groomers a reason to stay
  (auto-rebooking that fills the calendar).

**Last goal (lowest priority)**
- Rewards/discounts (a simple loyalty perk) once the core loop is proven.

**Non-goals (explicit)**
- No facility/enterprise features (boarding, daycare, kennel, multi-location chains).
- No consumer marketplace, and no taking a % of the owner's revenue (flat subscription only).
- No native mobile app this semester (mobile web + SMS only).
- No AI receptionist / automated Instagram-DM booking (not reliably scalable; Meta gates the
  messaging API). Auto-SMS covers the automated-communication need.
- No veterinary/medical records or health-regulated data.

## User personas

**Sandy, 58, groomer of 25 years (small shop).** Runs everything from a spiral notebook and her
cell. Full grooms every 4–8 weeks. Pain: misses calls while grooming, forgets to remind clients,
never nudges rebooks, "not a computer person." She needs it to just work.

**Dana, 34, independent dog trainer.** Private + in-home lessons and board-and-train, booked over
calls/DMs, progress in a spreadsheet. Pain: evenings lost to admin; clients drop mid-package
because they can't "see" progress; generic tools don't do packages or notes.

**Marcus, 41, mobile groomer.** Books by phone/text between stops. Pain: no-shows waste a whole
slot and a drive; MoeGo is too complex and charges per van with metered texts.

**Secondary actor — the pet owner (end client).** Books online, gets reminders, leaves reviews.
Not the buyer, but their experience drives the owner's willingness to pay.

## Core features

1. **Self-serve booking (S1)** — services by type (grooming/training) and size/duration, each
   with price and optional deposit; real-time availability; instant confirmations to both sides.
2. **Embeddable booking, everywhere (S1)** — a booking widget the owner drops onto their own
   website with a snippet, plus a shareable link for their Instagram bio, Google, and texts. No
   website? They get a simple hosted booking page.
3. **Automated SMS reminders (S2)** — 24h reminder with a cancel/reschedule link; cancel reopens
   the slot and notifies the owner; every send + outcome logged. Simple keyword replies (e.g.
   reply C to confirm) — no AI needed.
4. **Owner dashboard + "Revenue Recovered" (S3)** — today/this-week view with empty and error
   states, plus a running tally of money saved from prevented no-shows, filled waitlist slots, and
   auto-rebookings, so the ROI is undeniable.
5. **SMS consent capture (S4)** — explicit, timestamped opt-in; no consent, no texts; honors STOP.
6. **Auto-rebooking on cadence (S5)** — per-service rebook cycle; one nudge with a link;
   suppressed if a future appointment already exists.
7. **Automated review requests (S6)** — one post-visit review request by SMS with a direct link;
   not re-sent to clients who already reviewed.
8. **Client/dog records + session notes (S7)** — notes/homework per session, viewable by the
   client via a private link (no app), the training wedge.
9. **Waitlist auto-fill (S8)** — freed slots offered to the next waitlisted client by SMS with a
   claim window.
10. **Meta attribution (S9)** — every booking carries a source and can fire a Meta conversion
    event, so ad spend is provable.
11. **Payments: packages & deposits (S10)** — deposits and multi-session packages through the
    owner's own Stripe.
12. **Rewards/discounts (last, lowest priority)** — a simple loyalty perk (e.g. a discount after
    N visits) once the core loop is proven.

## What makes it hard to say no to

- **Done-for-you setup for non-techy owners.** Import contacts from a spreadsheet or phone, and
  the portal + booking page are built in minutes. Removes the "I don't know where to start"
  barrier.
- **It works over text.** The owner barely touches an app; reminders and rebooking run on SMS, so
  a 58-year-old groomer can adopt it in a day.
- **ROI you can see.** The "Revenue Recovered" number turns the subscription into an obvious
  profit, not a cost.
- **Embeddable anywhere.** One snippet on their site, one link in their bio, bookings flow in.
- **Growth, not just software.** The Meta offer brings them clients while the portal runs ops, a
  bundle incumbents don't offer.

## UI / UX

- **Mobile-first, dead simple.** Big touch targets, minimal steps, plain language, no jargon,
  built for someone doing this between dogs. Calm, premium, Apple-inspired.
- **Owner app:** a home dashboard (today's schedule, alerts, Revenue Recovered), tap-to-add
  booking, and a client/dog list.
- **Client booking page/widget:** branded to the owner, 3 taps to book (service → time →
  details), visible availability, clear consent + deposit steps, confirmation screen; embeddable
  on the owner's site or used as a hosted page.
- **Every screen has an empty state and an error state** (per `CLAUDE.md`).
- **Accessibility:** large fonts, high contrast, SMS fallbacks so the least-technical owner and
  client can still complete every task.

## Payment processing

- Stripe Connect: each owner connects their own Stripe; money lands with them, not the platform.
- Deposits required at booking on selected services (protects high-value slots like
  board-and-train); packages sold as prepaid session bundles.
- Subscriptions (Starter/Pro/Team) billed to the owner via Stripe, with failed-payment retries.
- No percentage cut of the owner's revenue, ever (the anti-Fresha stance).

## User flow

**Owner side**
1. Clicks a Meta ad, lands on the offer page, and starts a trial or books a demo.
2. Done-for-you setup: imports contacts; we generate services, the booking page/widget, and
   reminder templates.
3. Connects Stripe and registers their SMS sender (A2P).
4. Embeds the booking widget on their site and drops the link in their Instagram bio.
5. Runs the day from the dashboard and watches Revenue Recovered climb; upgrades tier as they grow.

**Customer (pet owner) side**
1. Finds the business (ad, the owner's website, or IG bio link).
2. Books through the embedded widget or link; picks a service and an open slot.
3. Enters their details + dog, gives SMS consent, pays a deposit if required.
4. Gets a confirmation, then a 24h reminder (cancel reopens the slot).
5. Visit happens; for training, views session notes/homework via a private link.
6. Gets a review request; later gets one rebooking nudge on cycle and books again.

## Database

Postgres (via Supabase) with per-account row-level security. Core entities:

- **Account** (owner/business) — business_name, owner_name, email, phone, plan
  (starter/pro/team), stripe_account_id, sms_sender_id, timezone.
- **Staff** — belongs to Account; name, role (owner/staff). For the Team tier.
- **Service** — belongs to Account; name, type (grooming/training), size_tier
  (small/medium/large/xl/na), duration_min, price, requires_deposit, deposit_amount,
  rebook_cycle_days, active.
- **Client** — belongs to Account; name, phone, email, sms_consent, sms_consent_at.
- **Dog** — belongs to Client; name, breed, size, notes.
- **Booking** — belongs to Account, Client, Dog, Service (optional Staff); start_time, end_time,
  status (pending/confirmed/completed/cancelled/no_show), source (organic/meta/referral).
- **Lead** — belongs to Account; name, phone, source, status (new/contacted/booked/lost). Captures
  Meta-ad inquiries.
- **Reminder** — belongs to Booking; channel (sms), scheduled_for, sent_at, status, outcome
  (confirmed/cancelled/none).
- **SessionNote** — belongs to Booking + Dog; notes, homework, share_token (private client link).
- **ReviewRequest** — belongs to Booking; sent_at, review_link, status (pending/sent/reviewed).
- **Package** — belongs to Client + Service; sessions_total, sessions_used.
- **Payment** — belongs to Account + Client, optional Booking or Package; amount, type
  (deposit/package/full/subscription), stripe_payment_id, status.
- **Reward** (last-priority) — belongs to Account + Client; type (discount/perk), threshold,
  status.
- **ConversionEvent** — belongs to Booking; source, utm, meta_event_id, fired_at.

**Key relationships**
- An Account has many Staff, Services, Clients, Bookings, and Leads.
- A Client has many Dogs and Bookings.
- A Booking has its Reminder(s), an optional SessionNote, one ReviewRequest, and an optional
  ConversionEvent.
- A Package belongs to a Client + Service; a Payment belongs to an Account + Client and optionally
  a Booking or Package.

## Backend

- Supabase (Postgres, Auth, Storage) with row-level security for per-account isolation.
- Service layer for external integrations (Twilio, Stripe, Meta) behind clean interfaces.
- Background job queue for scheduled, idempotent work: reminders, rebooking nudges, review
  requests, waitlist offers, conversion events (n8n and/or Supabase scheduled functions).
- Webhooks: Twilio inbound SMS (keyword replies), Stripe payment status.
- Logging + alerting on delivery failures and job errors.

## Frontend

- Next.js / React / Tailwind, mobile-first, server-rendered for fast loads.
- Owner app (dashboard, bookings, clients/dogs, settings) and a branded public booking page,
  plus an embeddable booking widget (a small script the owner pastes into their own site).
- Component library with built-in empty/error/loading states.
- Real-time dashboard updates (new bookings) via Supabase subscriptions.
- Meta Pixel on public pages; accessible, large-touch UI for low-tech users.

## API integration points

- **Twilio** — reminders, nudges, review requests, and simple two-way keyword replies (confirm/
  cancel); A2P 10DLC registration.
- **Stripe Connect** — deposits, packages, subscriptions; webhooks for status.
- **Meta Conversions API** — fire booking/lead conversion events for ad optimization.
- **Calendar (optional)** — Google Calendar sync to block personal time.

## Technical requirements

1. Booking must show real availability and prevent double-booking. Why? A confirmed-but-taken
   slot destroys trust on day one. (S1) — Frontend, Backend/DB
2. The booking widget must embed on any owner website with a single snippet and also work as a
   hosted page. Why? Owners live on different site builders; embedding must be trivial. (S1) —
   Frontend
3. Reminders/nudges run as idempotent scheduled jobs. Why? Fire once, on time, across restarts;
   duplicates annoy clients. (S2, S5) — Job queue, Twilio
4. SMS consent stored with timestamp + wording and enforced before any send; honor STOP. Why?
   Legal (TCPA / A2P 10DLC) and ethical. (S4) — Backend, Compliance
5. Deposits/packages/subscriptions run through the owner's connected Stripe. Why? Money lands with
   the owner; avoids platform liability. (S10) — Stripe Connect
6. Every booking records a source and can fire a Meta conversion event. Why? Attribution is
   required to optimize spend and prove the funnel. (S9) — Backend, Meta CAPI
7. Session notes shareable via a tokenized link, no client login. Why? Friction kills engagement.
   (S7) — Frontend, Backend
8. Every view has explicit empty and error states. Why? Blank/broken reads as "it failed." (S3,
   per `CLAUDE.md`) — Frontend

## Non-functional requirements

- **Security:** auth/authorization, per-account row-level security, secret storage, input
  validation, expiring tokenized links.
- **Compliance:** SMS consent + STOP handling, A2P 10DLC, owner-owned payment data.
- **Performance:** booking page/widget p95 < 2s on mobile; reminder dispatch within 1 min of
  schedule.
- **Reliability:** high SMS delivery success; jobs retry with alerting.

## Pricing (business model)

Flat, feature-gated tiers; no per-seat/per-van; texts included (fair-use cap); owner connects
their own Stripe.

| Plan | $/mo flat | Adds |
| --- | --- | --- |
| Starter | 29 | booking, reminders, reviews, fair-use texts |
| Pro (hero) | 49 | + rebooking automation, packages, waitlist, session notes, Meta attribution |
| Team | 99 | + multiple calendars, rewards/discounts, no per-seat trap |

## What we'll watch (plain terms)

- Are no-shows going down for reminded clients?
- Are clients booking themselves instead of the owner doing it by hand?
- Are past clients coming back (rebooking)?
- Does a Meta ad turn into a paying owner for a reasonable cost?

## Risks and open questions

- Grooming is contested (MoeGo). Mitigation: lead with training + the flat-price/unlimited-text
  wedge and easy embedding, not feature parity.
- Distribution: need real pet-pro interviews and early customers to seed Meta lookalikes (first
  discovery outreach in progress with a local trainer, Cohesive Canine Training).
- Open: product name; exact per-tier feature split; training-led vs. co-equal launch.

## Dependent stakeholders

- Twilio (A2P 10DLC approval, external gating step), Stripe (Connect onboarding), Meta (business
  verification + ad account), and early pilot pros for validation.

## Next

CP-M3 · Architecture · Oct 11 — [`docs/03-architecture.md`](03-architecture.md)
