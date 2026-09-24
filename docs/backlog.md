# Backlog

**Source.** Lab 3
**Status.** Keep current, not historical. This is what we build against.
**Product context.** Studio OS (working placeholder name) — booking + reminders + reviews +
rebooking for independent dog trainers and groomers. Availability comes from the owner's own
calendar; payments run through the owner's Stripe or Square; sold to the owner-operator; scaled via
Meta ads (later upsell). Flat, feature-based tiers ($29 / $49 / $99) — provisional and config-driven.

## Decisions applied (CP-M2 review)
Per [`decisions/0002-cp-m2-founder-decisions.md`](decisions/0002-cp-m2-founder-decisions.md):
calendar sync (Google/Apple) is a core integration; payments support Stripe **or** Square;
bookings are blocked under 24h out; policies (deposit/refund/cancellation/cadence/buffer/timezone)
are owner-configured; tier gating is config-driven (tracked as **B1**); Meta Pixel now, CAPI later.
Waitlist entity modeling and rebook-suppression scope are open for CP-M3.

## Editor's note on evidence
This is my product, not the model's. Every kept story points at evidence I can show: the market
research in `docs/research/`, published pricing/cadence data, and my own observed behaviour
running Palmm for service businesses. `‹quote: …›` marks a spot that still needs a direct
interview quote from a real trainer/groomer, or the story gets cut. Unsupported ideas live in
**Won't**, not Must.

---

## Stories

### MUST — ship is meaningless without it

**S1 · Self-serve booking (grooming + training)**
**Story.** As an independent pet pro, I want clients to book the right service themselves online,
so that I stop taking every booking by phone and DM.

**Acceptance criteria**
- [ ] Given services defined by type/size (e.g. full groom – large, private lesson – 1hr) and open
      slots derived from the owner's connected calendar, when a client picks one and submits details,
      then the slot is reserved and both sides get a confirmation.
- [ ] Given a slot that just filled, when a client tries to book it, then it's refused with a clear
      "no longer available" message and offered the next opening. (negative)
- [ ] Given a requested time less than 24 hours away, when a client tries to book it, then it's
      blocked with a clear message. (negative)
- [ ] A first-time client completes a booking in under 2 minutes with no owner contact.

**Evidence.** `docs/research/competitors-and-features.md`; trainers duct-tape Acuity+Square+sheets
("almost nothing built for trainers"). ‹quote: owner on manual-booking pain›

---

**S2 · Automated reminders (cut no-shows)**
**Story.** As an independent pet pro, I want confirmed clients reminded before their appointment,
so that fewer of them no-show and I don't lose a $40–$250 slot.

**Acceptance criteria**
- [ ] Given a confirmed booking, when it's 24h out, then the client gets an SMS reminder with time,
      service, and a cancel/reschedule link.
- [ ] Given a client who cancels from the reminder, when they cancel, then the slot reopens and the
      owner is notified. (negative / edge)
- [ ] Every reminder + outcome is logged so no-show rate is measurable without asking me.

**Evidence.** `docs/research/grand-prix-scheduler-lessons.md` (observed no-show drop after reminders);
published per-visit revenue $40–$250. ‹quote: before/after no-show figure›

---

**S3 · Owner dashboard (one source of truth)**
**Story.** As an independent pet pro, I want one screen for today's and this week's appointments,
so that I stop checking a notebook, a calendar, and my texts.

**Acceptance criteria**
- [ ] Given bookings exist, when the owner opens the dashboard, then upcoming appointments show
      client, dog, service, and time, soonest first.
- [ ] Given no bookings yet, when the owner opens it, then a clear empty state explains what will
      appear here. (empty state)
- [ ] Given a load/connection failure, when data can't be fetched, then an error state shows instead
      of a blank screen. (negative)

**Evidence.** Observed at Palmm clients: owners reconcile 3+ tools to see their day. ‹quote: the
"three places" problem›

---

**S4 · SMS consent capture**
**Story.** As a client, I want to opt in to texts when I book, so that the business can only text me
if I agreed.

**Acceptance criteria**
- [ ] Given the booking form, when the client submits, then explicit SMS consent is recorded with a
      timestamp and the wording shown.
- [ ] Given a client who did not opt in, when reminders/marketing run, then they get none. (negative)

**Evidence.** Compliance I already follow at Palmm (TCPA / Twilio A2P 10DLC) — required to run the
SMS features and the Meta funnel legitimately. Logged, observed practice.

---

### SHOULD — painful to omit, survivable

**S5 · Rebooking on cadence (the grooming retention engine)**
**Story.** As a groomer, I want clients auto-nudged to rebook on their grooming cycle, so that my
chair stays full without me chasing anyone.

**Acceptance criteria**
- [ ] Given a completed groom with a set cycle (e.g. 6 weeks), when the interval approaches, then the
      client gets one rebooking prompt with a booking link.
- [ ] Given a client who already has a future appointment, when the interval hits, then no nudge is
      sent. (negative)

**Evidence.** Published grooming cadence of every 4–8 weeks (recurring revenue); observed manual
"time for a groom?" texts. ‹quote: groomer on rebooking today›

---

**S6 · Automated review request**
**Story.** As an independent pet pro, I want a review request sent automatically after a visit, so
that I build reviews without remembering to ask.

**Acceptance criteria**
- [ ] Given a completed appointment, when it ends, then the client gets one review request with a
      direct link.
- [ ] Given a client who already reviewed, when the job runs, then they aren't asked again. (negative)

**Evidence.** `docs/research/meta-gtm-and-unit-economics.md` (reviews as acquisition lever); observed
manual asks. ‹quote: how they ask today›

---

**S7 · Client/dog records + session notes (the training wedge)**
**Story.** As a dog trainer, I want to log session notes and homework the owner can see, so that I
show real progress and keep clients through a package.

**Acceptance criteria**
- [ ] Given a completed session, when the trainer logs notes/homework, then the client can view them
      via a private link with no app to install.
- [ ] Given a session with no notes entered, when the client opens the link, then they see a clear
      "no notes yet" state, not an error. (negative / empty)

**Evidence.** Trainers keep progress in spreadsheets because generic booking tools don't (see
research). ‹quote: trainer on tracking progress today›

---

### COULD — genuinely nice

**S8 · Waitlist auto-fill**
**Story.** As an independent pet pro, I want cancellations offered to a waitlist, so that freed slots
still get filled.

**Acceptance criteria**
- [ ] Given a waitlisted client and a freed slot, when a cancellation happens, then the next client is
      offered it by SMS with a claim window.
- [ ] Given no one on the waitlist, when a slot frees, then it reopens for public booking. (negative)

**Evidence.** Empty last-minute slots = lost revenue (grand-prix lessons). ‹quote: cancellation loss›
**Open (CP-M3).** Model a waitlisted client as a Booking with a `waitlisted` status or as its own
entity? Decides how claim windows and expiration work.

---

**S9 · Booking-source attribution (prove the ad worked)**
**Story.** As an owner, I want to see which signups/bookings came from Meta ads, so that I know the
ad spend produced paying clients.

**Acceptance criteria**
- [ ] Given a booking from a Meta ad link, when it completes, then its source is recorded (and, once
      Meta ads are turned on, a conversion event fires — Pixel is embedded now, CAPI deferred).
- [ ] Given a booking with no ad source, when it completes, then it's recorded as organic, not
      miscredited to ads. (negative)

**Evidence.** `docs/research/meta-gtm-and-unit-economics.md`; ~$150 SMB-SaaS Meta CAC needs attribution
to optimize.

---

**S10 · Packages & deposits**
**Story.** As an independent pet pro, I want to sell session packages and take a deposit at booking,
so that clients commit and I protect high-value slots (board-and-train, multi-session).

**Acceptance criteria**
- [ ] Given a package/deposit service, when a client books, then payment is collected via the owner's
      chosen processor (Stripe or Square) before the slot is confirmed.
- [ ] Given a failed/declined payment, when the client submits, then the slot is not held and a clear
      retry message shows. (negative)

**Evidence.** Training sold in 4–8 session packages; board-and-train $1,000–$3,000/wk (published
pricing). ‹quote: owner on deposits/packages›

---

### WON'T (this semester) — with why

- **Facility features (boarding, daycare, kennel, multi-location).** That's MoeGo/Gingr's turf and a
  different, heavier product; competing there kills the "simple for solos" wedge.
- **Consumer marketplace.** No evidence solos want to share clients; adds huge scope.
- **Taking a % of the pro's revenue.** Owners resent it (Fresha's 20% cut). Flat subscription only.
- **Native mobile app.** Mobile web covers the ad → signup → booking path this semester.

*(Won't is non-empty on purpose — I'll defend each cut out loud.)*

---

## MoSCoW board

| MUST | SHOULD | COULD | WON'T (+ why) |
| --- | --- | --- | --- |
| S1 Self-serve booking | S5 Rebooking cadence | S8 Waitlist auto-fill | Facility features — wrong product |
| S2 Auto reminders | S6 Auto review request | S9 Meta attribution | Marketplace — no evidence |
| S3 Owner dashboard | S7 Session notes (training) | S10 Packages & deposits | %-of-revenue — owners resent it |
| S4 SMS consent | | | Native app — web is enough |

---

## Break-test log
Could someone who never spoke to me tell pass from fail, with no hidden assumptions?

- **S1 (booking) — survived.** "Completes a booking in under 2 minutes with no owner contact" is
  outsider-checkable and measurable; the slot-already-filled negative case is explicit.
- **S2 (reminders) — failed, then fixed.** First draft was "clients get reminders so fewer no-show" —
  "fewer" isn't measurable and there was no negative case. Rewritten to a concrete 24h SMS, a
  cancel→slot-reopens negative case, and a logged-outcome criterion so no-show rate is measurable.

---

## MVP slice (smallest end-to-end demo)
**Book → confirm → remind → owner sees it.** (S1 + S2 + the view half of S3, gated by S4 consent.)

A real client books a groom or a lesson online, opts in, gets a confirmation and a 24h reminder, and
it appears on the owner's dashboard. Screen-recordable start to finish with no "imagine it saves"
hand-waving. Deliberately smaller than the full Must column — rebooking (S5), reviews (S6), and notes
(S7) are not in the slice.

## Next

Lab 3 feeds CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
