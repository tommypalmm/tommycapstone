# 01 · Concept brief

**Milestone.** CP-M1 · Sep 9
**Status.** Draft

## Working title

Studio OS — the operating system for a boutique studio. (Working name; niche still tightening.)

## One sentence

A booking-and-retention system for the owner of a single-location boutique studio, so their
schedule fills itself and clients come back — without hiring a front desk — and it's a real
product I can sell through Meta ads.

## Who it's for

The owner-operator of a single-location boutique studio — think pilates, yoga, lash/brow,
or a small med-spa: one to a few staff, the owner often delivering the service themselves.
They're on their phone between clients, they book people manually over DM and text, and they
lose money to no-shows and empty last-minute slots. This is the CUSTOMER, not me — the whole
point is that it's sellable to people like them.

‹Tightest open decision: pick the exact first niche. Everything downstream sharpens once it's
one specific type of studio.›

## The job it does

When my day is packed with clients and admin, I want bookings, reminders, and review requests
to run themselves, so I can keep my schedule full and my clients coming back without paying
for a front desk.

## The problem

Boutique owners run the business from their phone between sessions. Booking is manual (DMs,
texts, a paper book), no-shows and unfilled cancellations quietly bleed revenue, and reviews
and rebookings only happen when the owner remembers to ask. There's no single place that runs
the operational loop.

## Current workaround

A mix of DMs and texts, a paper or calendar-app schedule, and manually asking for reviews.
Some pay for a generic scheduler that handles bookings but not reminders, waitlists, reviews,
or retention — so the owner still stitches the rest together by hand.

## Why this, why now

I already do this work through Palmm for real service businesses, so I'm building from observed
behaviour, not guesses (see `docs/research/`, including the Grand Prix scheduler lessons). The
tooling finally makes it a solo build — AI coding in Cursor, LLMs for the fuzzy parts, Twilio
for SMS — and Palmm's go-to-market (Meta ads → landing page → lead) is a proven way to actually
sell it.

## In scope

MVP — the core operating loop, sellable end to end:

- Client self-serve online booking.
- Automated SMS reminders to cut no-shows (with SMS consent captured at booking).
- An owner dashboard showing the day/week at a glance, with clear empty and error states.
- Automated review requests and waitlist fill for cancellations (fast-follow).
- Booking-source attribution + Meta Pixel/Conversions so ad-driven bookings are provable.

Full story-level detail lives in [`docs/backlog.md`](backlog.md).

## Out of scope

- Native mobile app (mobile web is enough for the ad → booking path).
- In-app payments / POS (Stripe can come later).
- Multi-location / franchise (the persona is the single-location owner).
- A built-in client messaging inbox (no evidence yet; competes with the owner's phone).

## What success looks like

A real boutique owner runs a full week on it — clients book themselves, reminders cut
no-shows, and the owner stops booking by hand — and, critically, at least one paying customer
is acquired through a Meta ad funnel that points at a working product. If an owner would rather
open this than their current setup, and an ad can legitimately sell it, it's working.

## Risks

Biggest unknown: whether boutique owners will switch from the tool they already use, and
whether the chosen niche is big and reachable enough at the target price for Meta-ad economics
to work. Close behind: getting the integrations/APIs (calendar, SMS, Meta) I need, and staying
compliant enough (SMS consent, ad claims) to advertise legitimately.

## Stack guess

Built with Cursor, on my usual stack: Next.js / React / Tailwind (marketing site + app),
Supabase (data + auth), Twilio (SMS), Stripe (payments, later), n8n (automations), Vercel,
plus Meta Pixel + Conversions API. Week 7 teaches stack selection; CP-M3 decides it.

## Open questions

- Which exact studio niche do we commit to first?
- Google Calendar as the source of truth, or a booking calendar built in?
- How much does the AI decide (auto-waitlist, auto-rebook) vs. just surface to the owner?

## Next

CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
