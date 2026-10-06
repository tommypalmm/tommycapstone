# PetPro OS: MVP Build Choices

**Source.** First build of the app in `src/`, against [`02-prd.md`](../02-prd.md)
**Date.** October 1, 2026
**Status.** Draft. These are working defaults. Several CP-M3 open questions are answered here provisionally, and [`03-architecture.md`](../03-architecture.md) can confirm or replace them.

These are the calls made during the build where the PRD was open, silent, or couldn't be implemented as written. Each one says what was built and why.

## 29. Database and local development

**Built.** Postgres everywhere. Without `DATABASE_URL`, the app runs PGlite, an embedded Postgres, from `.data/pglite`. With `DATABASE_URL`, the same SQL runs on Supabase Postgres. Schema migrations live in `src/lib/migrations.ts` and apply on startup.

**Why.** It needs no Docker and no Supabase account to run or demo, and there is no second database dialect to maintain.

**Not done yet.** Supabase Auth and row-level security policies (CP-M3, Decision #14). Tenancy is currently enforced in the app layer: every query filters by the logged-in member's `account_id`.

## 30. Auth and roles

**Built.** Email and password logins (scrypt hashes, server-side sessions). Each owner and staff member has their own login. Every owner-only page, action, and export calls `requireOwner()` on the server, so a staff member who replays an owner form gets nothing (Decision #22).

## 31. Job queue engine

**Built.** A Postgres `jobs` table, one row per confirmation, reminder, rebook nudge, review request, or notes link. A unique key on booking + kind makes each job idempotent, and `FOR UPDATE SKIP LOCKED` claims a job before it runs. An in-process ticker runs every 30 seconds. On serverless hosts, set `JOB_TICKER=off` and call `/api/cron/tick` every minute. Failed sends retry 3 times, then show as alerts on the dashboard.

**Why.** It meets "dispatch within 1 minute" with no extra service. This provisionally answers n8n vs Supabase scheduled functions (Decision #14).

## 32. Simultaneous confirms of the same slot

**PRD.** Decision #19 says to reject both colliding confirms and tell both clients to try again.

**Built.** A partial unique index on `(staff_id, start_time)` for non-cancelled bookings. The first write commits and that client is booked. Every later write fails, and that client sees "that time was just taken, please pick another time and try again." A test of 6 simultaneous confirms produced 1 booking and 5 retry messages.

**Why.** By the time the second write fails, the first is already committed and confirmed. Rejecting it too would mean cancelling a booking the client was already told about, which is the trust problem the rule exists to prevent. Needs founder sign-off.

## 33. SMS reply keywords

**PRD.** Decision #8 lists "reply C to confirm, cancel, STOP".

**Built.** `C` confirms and `X` cancels the next appointment. `STOP` (and the other carrier opt-out words) opts the client out, and `START` opts them back in. Anything else gets one fallback text pointing to the owner's contact link or phone number. All replies are logged.

**Why.** `CANCEL` is a built-in Twilio and carrier opt-out keyword, the same as `STOP`. A client who texts CANCEL to cancel one appointment would be unsubscribed from all texts. So `CANCEL` is treated as an opt-out, and the reminder copy says "Reply C to confirm or X to cancel."

## 34. Rebook suppression scope

**Built.** A rebook nudge is skipped if the client has any future appointment, with any service. The nudge goes out 7 days before the cycle is due (for short cycles, at 75% of the cycle). The cycle comes from the service's `rebook_cycle_days`, falling back to the owner's default.

**Why.** It's the simplest rule that satisfies the S5 acceptance criteria. Decision #14 still needs the founder's call on same-service-only for training.

## 35. Review requests

**Built.** One review request per client, ever, sent 1 hour after a booking is marked completed, and only if the owner has set a review link.

**Why.** The platform can't verify that a review was posted (Decision #13), so "already reviewed" (S6) is approximated as "already asked."

## 36. Revenue Recovered

**Built.** The total of completed visits where the client replied `C` to the reminder, plus completed visits booked from a rebook nudge. The dashboard shows both parts.

**Why.** The PRD names the number but not the formula. This version only counts visits with direct evidence that the platform helped.

## 37. Phone numbers

**Built.** Numbers are normalized to E.164 per account (Decision #23). A 10-digit number with no country code is assumed to be US or Canada (+1).

## 38. Booking address

**Built.** One shared booking page, `/book?b=<business-slug>` (Decision #27). The website embed is `<script src=".../embed.js" data-business="<slug>">`, which inserts that page as an iframe. `?src=meta` (or `utm_source=facebook`/`instagram`) marks a booking as coming from Meta ads. With no ad source, a booking is recorded as organic.

## 39. Deliberately not built in this pass

- **Collecting deposits or packages through Stripe or Square.** Owners can choose a processor and set deposit amounts per service, and clients see the deposit and policy text when booking. No money is taken yet, because the processor abstraction waits on parity confirmation (Decision #21).
- **Founder SaaS billing, dunning, and automatic shutdown after failed payments.** An owner can close their account manually, which runs the full offboarding: booking page offline, future bookings cancelled with a text to each client who opted in, scheduled jobs cancelled, and CSV export still available.
- **Meta Conversions API** (Decision #12). The Pixel is built, with PageView and Schedule events on the booking page.
- **Rewards** (last goal), **Lead entity**, **contact import**, and **real-time dashboard updates**.
- **Tokenized link expiry and revocation** (Decision #26, still deferred).
