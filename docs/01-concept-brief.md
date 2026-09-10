# 01 · Concept brief

**Milestone.** CP-M1 · Sep 9
**Status.** Draft

## Working title

**Front Desk** — an AI receptionist that answers missed calls and texts for a
service business and turns them into booked jobs. (Name can change.)

## One sentence

A text-first AI receptionist for the owner-operator of a one-location auto
detailing shop, so missed calls and after-hours messages get answered in under
a minute and become booked appointments instead of lost jobs.

## Who it's for

Not "small businesses." One person: the owner-operator of a single-location
auto detailing shop — think Grand Prix Auto Spa — who does most of the
detailing himself with one or two helpers. When a lead comes in he is usually
under a car with wet hands, wearing gloves, or running a buffer, so he can't
pick up. He lives on his phone between jobs and will glance at a simple
dashboard, but he is not going to sit at a computer. His callers are
high-intent and impatient: they book whichever shop answers first.

If the honest first user is "a business I already work with through Palmm," that
is exactly the point — I have real access to this person and can watch them use
it, rather than inventing an audience.

## The job it does

When a call or text comes in while I'm mid-detail and can't answer, I want it
answered right away with real answers about services, price ranges, and
availability, and turned into a booked appointment, so I can stop losing jobs to
whichever competitor picked up the phone first.

## Current workaround

Voicemail that nobody listens to, a spouse or helper answering when they can, or
texting people back hours later once the lead has already gone cold. A few shops
pay for a generic answering service, but it doesn't know their pricing, their
services, or what times are actually open, so it just takes a message — which is
the same problem with extra steps. "Nothing" isn't the alternative; losing the
lead is.

## Why this, why now

Two things are newly true: LLMs are now cheap and good enough to hold a real
booking conversation, and Twilio + a calendar make the plumbing a solo build.
Just as important, this is the core of what Palmm already does for service SMBs,
so I have live users and real phone/booking data to test against instead of
guesses.

## In scope

MVP, text-first (SMS):

- Auto-respond to inbound texts within seconds.
- Answer common questions from a shop profile: services offered, price ranges,
  hours, location.
- Collect the essentials of a job — vehicle, service wanted, preferred time.
- Book into a calendar and confirm the appointment by text.
- Notify the owner and show a simple dashboard of conversations and bookings,
  with an obvious empty state and an error state when a booking can't complete.

## Out of scope

- Live voice-call handling (start with SMS; voice is a later bet).
- Outbound marketing / drip campaigns.
- Payments and deposits (maybe a later milestone, not the MVP).
- A full CRM, multi-location support, and review management.

## What success looks like

A two-week pilot with one real detailing shop where:

- 90%+ of inbound texts get a useful reply within one minute, and
- at least a handful of appointments get booked without the owner touching his
  phone, and
- the owner says he'd keep it running after the pilot.

Rough is fine; the bar is "it booked a real job on its own," not "it's polished."

## Risks

The biggest unknown: whether customers will actually finish a booking over text
with an AI, or whether enough of them insist on calling and talking to a person
that the whole premise leaks. Close behind: whether I can get availability and
pricing structured cleanly enough that the AI answers reliably instead of making
things up — a wrong price or a double-booked slot burns trust fast.

## Stack guess

Likely Next.js / React / Tailwind, Supabase (data + auth), Twilio (SMS), an LLM
API for the conversation, deployed on Vercel. This is a guess — Week 7 teaches
stack selection and CP-M3 is where it's actually decided.

## Open questions

- SMS-only for the MVP, or is a missed-call-to-text auto-reply the true wedge?
- Which calendar is the source of truth (Google Calendar, or something built in)?
- How much should the AI quote on price vs. hand a hot lead straight to the owner?

## Next

CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
