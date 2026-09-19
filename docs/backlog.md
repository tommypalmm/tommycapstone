# Backlog

**Source.** Lab 3
**Status.** Keep current, not historical. This is what we build against.
**Product context.** Studio OS — booking + SMS + reviews + retention for a single-location
boutique studio owner. (Working niche; tighten the persona as interviews land.)

## Editor's note on evidence
This is my product, not the model's. Every kept story points at evidence I can actually show:
my productization research in `docs/research/` and my own observed behaviour running Palmm for
real service businesses (e.g. the Grand Prix scheduler work). Where a line reads `‹quote: …›`,
I still owe a direct interview quote or a dated log entry — I attach it or I cut the story.
Ideas with no evidence yet live in **Won't**, not in Must.

---

## Stories

### MUST — ship is meaningless without it

**S1 · Self-serve booking**
**Story.** As a boutique studio owner, I want clients to book open slots themselves online,
so that I stop booking every client by hand over DM and phone.

**Acceptance criteria**
- [ ] Given an open slot, when a client selects it and submits their details, then the slot is
      reserved and both client and owner receive a confirmation.
- [ ] Given a slot that filled seconds earlier, when a client tries to book it, then it is
      refused with a clear "no longer available" message and offered the next opening. (negative)
- [ ] A first-time client completes a booking in under 2 minutes with no owner contact.

**Evidence.** `docs/research/competitors-and-features.md` — every competitor leads with
self-serve booking; and observed: Palmm studio clients still take bookings manually by DM.
‹quote: owner interview on manual-booking pain›

---

**S2 · Automated reminders (cut no-shows)**
**Story.** As a boutique studio owner, I want confirmed clients reminded before their
appointment, so that fewer of them no-show.

**Acceptance criteria**
- [ ] Given a confirmed booking, when the appointment is 24h out, then the client is sent an
      SMS reminder with time, location, and a cancel/reschedule link.
- [ ] Given a client who cancels from that reminder, when they cancel, then the slot reopens
      and the owner is notified. (negative / edge)
- [ ] Every reminder send + outcome is logged so no-show rate is measurable without asking me.

**Evidence.** `docs/research/grand-prix-scheduler-lessons.md` — observed no-show pattern when
no reminder was sent, and the drop after adding reminders. ‹quote: exact before/after figure›

---

**S3 · Owner dashboard (one source of truth)**
**Story.** As a boutique studio owner, I want one screen for today's and this week's bookings,
so that I stop checking three tools to know what's happening.

**Acceptance criteria**
- [ ] Given bookings exist, when the owner opens the dashboard, then upcoming bookings show
      client, service, and time, soonest first.
- [ ] Given no bookings yet, when the owner opens it, then a clear empty state explains what
      will appear here. (empty state)
- [ ] Given a load/connection failure, when data can't be fetched, then an error state is shown
      instead of a blank screen. (negative)

**Evidence.** Observed running Palmm: owners reconcile a calendar, a notes app, and texts to
see their day. ‹quote: owner describing the "three tabs" problem›

---

**S4 · SMS consent capture**
**Story.** As a client, I want to opt in to texts when I book, so that the studio can only
text me if I agreed.

**Acceptance criteria**
- [ ] Given the booking form, when the client submits, then explicit SMS consent is recorded
      with a timestamp and the wording shown.
- [ ] Given a client who did not opt in, when reminders/marketing run, then they receive none.
      (negative)

**Evidence.** Compliance requirement I already follow at Palmm (TCPA / Twilio A2P 10DLC) — I
can't legitimately run the SMS features or Meta funnel without it. Logged, observed practice.

---

### SHOULD — painful to omit, survivable

**S5 · Automated review request**
**Story.** As a boutique studio owner, I want a review request sent automatically after a
visit, so that I get more reviews without remembering to ask.

**Acceptance criteria**
- [ ] Given a completed appointment, when it ends, then the client is sent one review request
      with a direct link.
- [ ] Given a client who already reviewed, when the job runs, then they are not asked again.
      (negative)

**Evidence.** `docs/research/meta-gtm-and-unit-economics.md` — reviews as a top acquisition
lever for boutiques; observed manual "can you leave a review?" asks at Palmm clients.
‹quote: owner on how they ask for reviews today›

---

**S6 · Waitlist auto-fill**
**Story.** As a boutique studio owner, I want last-minute cancellations offered to a waitlist,
so that freed slots still get filled and earn revenue.

**Acceptance criteria**
- [ ] Given a waitlisted client and a freed slot, when the cancellation happens, then the next
      waitlisted client is offered the slot by SMS with a claim window.
- [ ] Given no one on the waitlist, when a slot frees, then it simply reopens for public
      booking. (negative)

**Evidence.** `docs/research/grand-prix-scheduler-lessons.md` — empty last-minute slots = lost
revenue; observed scramble to fill cancellations by hand. ‹quote: owner on cancellation loss›

---

**S7 · Booking-source attribution (prove the ad worked)**
**Story.** As a boutique studio owner, I want to see which bookings came from my Meta ads,
so that I know the ad spend is actually producing paying clients.

**Acceptance criteria**
- [ ] Given a booking that originated from a Meta ad link, when it completes, then its source
      is recorded and a Meta conversion event is fired.
- [ ] Given a booking with no ad source, when it completes, then it is recorded as organic,
      not miscredited to ads. (negative)

**Evidence.** `docs/research/meta-gtm-and-unit-economics.md` and the Palmm lead-guarantee
model — attribution is required to prove ROI and to run/optimize the Meta funnel at all.

---

### COULD — genuinely nice

**S8 · Loyalty / punch-card**
**Story.** As a boutique studio owner, I want a simple loyalty punch-card, so that regulars
have a reason to keep booking with me.

**Acceptance criteria**
- [ ] Given a client with N completed visits, when they hit the threshold, then a reward is
      flagged automatically.
- [ ] Given a refunded or no-show visit, when counting toward the reward, then it does not
      count. (negative)

**Evidence.** `docs/research/boutique-studio-niches.md` — retention economics favour repeat
visits. ‹quote: owner interview confirming they'd use loyalty — else demote to Won't›

---

**S9 · Rebooking nudge**
**Story.** As a client, I want a nudge to book my next visit, so that I don't lapse without
meaning to.

**Acceptance criteria**
- [ ] Given a completed visit, when a set interval passes with no future booking, then the
      client gets exactly one rebooking prompt.
- [ ] Given a client who already rebooked, when the interval passes, then no nudge is sent.
      (negative)

**Evidence.** Observed at Palmm clients: lapsed regulars who "meant to rebook." ‹quote: owner
or client on forgetting to rebook — else demote to Won't›

---

### WON'T (this semester) — with why

- **Native mobile app.** No evidence owners or clients need an installed app to book; a mobile
  web funnel does the job and keeps the Meta ad → landing page path simple. Revisit if
  interviews demand it.
- **In-app payments / POS.** Stripe can come later. The core job this semester is filling slots
  and cutting no-shows, not processing money. Cutting it keeps the MVP demonstrable.
- **Multi-location / franchise.** The persona is the single-location owner. Multi-location is
  a different buyer and would blur the niche the whole product is aimed at.
- **In-app client messaging/inbox.** Tempting, but no interview evidence yet and it competes
  with the owner's existing phone. Parked until evidence says otherwise.

*(Won't is non-empty on purpose — I'll defend each cut out loud.)*

---

## MoSCoW board

| MUST | SHOULD | COULD | WON'T (+ why) |
| --- | --- | --- | --- |
| S1 Self-serve booking | S5 Auto review request | S8 Loyalty punch-card | Native app — web is enough |
| S2 Auto reminders | S6 Waitlist auto-fill | S9 Rebooking nudge | Payments/POS — later, keeps MVP small |
| S3 Owner dashboard | S7 Booking-source attribution | | Multi-location — wrong persona |
| S4 SMS consent | | | Client inbox — no evidence yet |

---

## Break-test log
The break-test: could someone who never spoke to me tell pass from fail, with no hidden
assumptions? Two AC sets run through it.

- **S1 (booking) — survived.** "Completes a booking in under 2 minutes with no owner contact"
  is outsider-checkable and measurable; the add/negative case (slot already filled) is
  explicit. No change needed.
- **S2 (reminders) — failed, then fixed.** First draft read *"clients get reminders so fewer
  no-show."* It broke: "fewer" isn't measurable, an outsider can't tell pass from fail, and
  there was no negative case. Rewritten to a concrete 24h SMS with cancel link, a cancel→slot
  reopens negative case, and a logged-outcome criterion so no-show rate is measurable.

---

## MVP slice (smallest end-to-end demo)
**Book → confirm → remind → owner sees it.** (S1 + S2 + the view half of S3, gated by S4 consent.)

A real client picks an open slot online, opts in, gets a confirmation and a 24h SMS reminder,
and the booking appears on the owner's dashboard. This is screen-recordable start to finish
with no "and then imagine it saves" hand-waving. It is deliberately smaller than the full Must
column — reviews (S5), waitlist (S6), and attribution (S7) are not in the slice.

## Next

Lab 3 feeds CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
