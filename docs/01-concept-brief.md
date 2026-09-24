# 01 · Concept brief

**Milestone.** CP-M1 · Sep 9
**Status.** Draft

## Working title

PetPro OS — the booking-and-retention operating system for independent dog trainers and
groomers. (Working name; open to change.)

## One sentence

A simple, flat-priced software system that lets an independent dog trainer or groomer take
bookings, cut no-shows, and keep clients rebooking — without a front desk — and it's a real
product I can sell to those owners through Meta ads.

## Who it's for

The independent, owner-operator pet pro: a solo (or 2–4 person) dog trainer and/or groomer who
does the work themselves, runs the business from their phone, and books clients over calls,
DMs, and a paper book or spreadsheet. This is the CUSTOMER I sell to — not the pet owner.

Two closely related buyers, one job:
- Dog trainers — private/in-home lessons, packages, board-and-train. Software here is wide
  open; most duct-tape Acuity + Square + a spreadsheet.
- Groomers — recurring full grooms every 4–8 weeks. Served by heavy tools (MoeGo) that solo
  operators find too complex and too expensive (per-van pricing, metered texts).

## The job it does

When my day is full of dogs and I can't stop to handle admin, I want bookings, reminders, and
rebookings to run themselves, so I can keep my schedule full and my clients coming back without
hiring help.

## The problem

Independent pet pros run on scattered tools — calls, DMs, Google Calendar, Square, a notebook.
No-shows and empty slots bleed real money ($40–$140 per groom, $75–$250 per training session),
rebooking only happens when they remember to ask, and the software that exists is either built
for someone bigger (facility platforms) or ignores them entirely (trainers).

## Current workaround

- Trainers: Acuity/Square for booking + a spreadsheet for notes + texts by hand. "Almost
  nothing is built specifically for trainers."
- Groomers: paper book, or MoeGo/Vagaro-class tools that overshoot a one-person shop on price
  and complexity.

## Why this, why now

Training software is a genuinely open market, and solo groomers are underserved by the
incumbents' pricing. I can build it solo with Cursor (Next.js, Supabase, Twilio, Stripe), and
the go-to-market is proven: vertical SaaS reliably acquires SMB owners on Meta at roughly a
$150 CAC, and pet content is unusually cheap and engaging to advertise.

## In scope

MVP — the core operating loop, sellable end to end:

- Client self-serve booking (services sized for both grooming and training).
- Automated SMS reminders to cut no-shows, with consent captured at booking.
- Owner dashboard of the day/week, with clear empty and error states.
- Rebooking automation on a cadence (grooming's every-4–8-week cycle) + review requests.
- Client/dog records with session/progress notes the owner can share (the training wedge).
- Booking-source attribution + Meta Pixel/Conversions so ad-driven signups are provable.

Full story-level detail: [`docs/backlog.md`](backlog.md).

## Out of scope

- Facility/enterprise features (boarding, daycare, kennel management, multi-location chains).
- A consumer marketplace, and taking a % of the pro's revenue (flat subscription only).
- Native mobile app (mobile web is enough for the ad → signup path).
- Anything requiring an API I can't actually get.

## Pricing model

Three flat, feature-based tiers — no per-seat, no per-van, texts included (the anti-incumbent
pitch). Owners connect their own Stripe; I make money on subscription, not their revenue.

| Plan | Price (flat/mo) | For | Adds |
| --- | --- | --- | --- |
| Starter | $29 | brand-new solo pro | booking, SMS reminders, reviews, fair-use texts |
| Pro (hero) | $49 | the core solo trainer/groomer | + rebooking automation, packages, progress notes, Meta attribution |
| Team | $99 | 2–4 person shop | multiple calendars, no per-seat trap |

Annual ≈ 2 months free. 14-day trial. Fair-use text cap protects margin while marketing
"texts included."

## What success looks like

A real pet pro runs a full week on it — clients book themselves, reminders cut no-shows, and
rebookings happen automatically — and at least one paying customer is acquired through a Meta ad
funnel pointing at a working product. If they'd rather open this than their spreadsheet, and an
ad can legitimately sell it, it's working.

## Risks

- Grooming is contested (MoeGo et al.). Mitigation: lead with the open training market and win
  solo groomers on simplicity + flat price + unlimited texts, not on feature parity.
- Distribution/access — I need real pet-pro interviews and early customers to seed Meta
  lookalikes. First job is getting 3 trainers/groomers on a call.
- Scope: "do both" must stay one simple product, not a generic pet platform.

## Stack guess

Built with Cursor, on Next.js / React / Tailwind, Supabase (data + auth), Twilio (SMS), Stripe
(payments), Vercel, plus Meta Pixel + Conversions API. Week 7 teaches stack selection; CP-M3
decides it.

## Open questions

- Product name.
- Training-led first, or trainers + groomers truly co-equal at launch?
- Exact feature split across the three tiers.

## Next

CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
