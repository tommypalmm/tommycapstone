# Studio OS — Founder Decisions Log, Round 2

**Source.** CP-M2 PRD follow-up, second review pass
**Date.** September 23, 2026
**Status.** Draft. Feeds into [`03-architecture.md`](../03-architecture.md) alongside [`0002-cp-m2-founder-decisions.md`](0002-cp-m2-founder-decisions.md).

Direct Q&A transcript, same format as round 1. This round changes a few things from the PRD that already includes round 1, notably dropping Apple Calendar and dropping the waitlist feature entirely. Those changes are reflected in [`02-prd.md`](../02-prd.md) and [`backlog.md`](../backlog.md), not only in this log.

## 16. Calendar provider scope

**Question.** Is Apple Calendar in scope for MVP given the CalDAV/app-specific-password limitations, and what OAuth scope level does Google Calendar get?

**Answer.** Apple Calendar is out. Google Calendar only. Google gets full read and write access, not read-only, since the platform needs to write staff bookings onto the owner's calendar. If an owner's calendar access is misconfigured or something goes wrong on their end because of how they've set up their own calendar, that is the owner's responsibility, not a platform failure mode to design heavily around.

## 17. Owner onboarding requirement before going live

**Question.** What must an owner configure before their booking page can accept any client bookings?

**Answer.** Before anything goes live, the owner must set their operating hours, their booking interval, and the duration/settings for each service they offer. Anyone can then book against that. Onboarding stays light, this is the minimum required setup, not an extended wizard.

## 18. Calendar conflict handling on the client-facing booking page

**Question.** What happens when a time slot conflicts with something on the owner's external Google Calendar?

**Answer.** If a slot conflicts with an event on the external calendar, it simply shows as unavailable on the booking calendar. No popup, no override/dismiss flow for this case. This effectively replaces the override/dismiss popup described in round 1 (Decision #5) for the client-facing booking view. Conflict resolution now happens by hiding the slot rather than surfacing a decision to the owner.

## 19. Double-booking race condition

**Question.** Is a hold or lock mechanism needed to prevent two clients from grabbing the same slot at nearly the same time?

**Answer.** No hold mechanism. If two bookings are grabbed for the same slot at the same time, reject both and tell both clients to try again.

**Implementation note.** "No hold mechanism" means no pre-booking reservation step in the UI, but the database still needs an atomic constraint at write time (for example a unique constraint on staff plus time slot) so that when two confirm requests land close together, the second write fails cleanly and both clients get the reject-and-retry message. Without that constraint at the database level, "reject both" cannot actually be enforced.

## 20. Subscription billing versus owner payment processor

**Question.** Is the platform's own SaaS subscription fee (Starter/Pro/Team) a separate payment relationship from the Stripe or Square account the owner connects for their own client payments?

**Answer.** Yes, explicitly separate. The platform's subscription fee is paid to the founder directly, always, regardless of which processor the owner uses. The owner's own Stripe or Square integration is solely for their business's client-facing payments (deposits, packages). The platform should make that owner-side integration as easy as possible to connect, but it is not the same billing relationship as the SaaS subscription.

## 21. Stripe/Square feature parity

**Question.** Do Stripe and Square support the same package billing and refund flows through a shared processor abstraction?

**Answer.** Believed to be equivalent for the features needed here, but not yet verified. Flagged as needing confirmation before the processor abstraction is finalized, not blocking the initial build.

## 22. Roles and permissions

**Question.** How do owner and staff logins differ, and what does each role see or edit?

**Answer.** The owner can edit business settings. Staff can view calendars and edit bookings, but do not get business-settings access. An authentication process needs to sit behind this role split, meaning staff need their own login credentials distinct from the owner's, with role-based permissions enforced at the backend, not just hidden in the UI.

## 23. Client identity and deduplication

**Question.** How is a returning client matched to their existing record instead of creating a duplicate?

**Answer.** Phone number is the unique client identifier. If a phone number has been seen before for that Account, it is the same client.

**Implementation note.** Phone numbers need to be normalized to a consistent format (for example E.164) before being used as a matching key, since the same number can be typed with or without a country code, spaces, or dashes. Matching should be scoped per Account, not globally across every owner on the platform.

## 24. SMS number and A2P 10DLC strategy, finalized

**Question.** Should the build target the shared single-number approach from round 1, or the subaccount approach flagged as a risk?

**Answer.** Changed from round 1. The founder is going with Twilio subaccounts: one Twilio brand/campaign registration, with per-owner subaccounts underneath it. This supersedes the single shared number plan in round 1 Decision #6. This is now the working assumption for architecture, not just a recommended fallback.

## 25. Waitlist feature, removed

**Question.** What is the claim window duration and ordering logic for the waitlist auto-fill feature (S8)?

**Answer.** There is no waitlist. This feature is cut entirely, not deferred.

This propagates beyond this log: S8 in [`backlog.md`](../backlog.md) is marked cut, the pricing table in [`02-prd.md`](../02-prd.md) no longer lists "waitlist" as a Pro-tier feature, and the Waitlist entity question raised in round 1 (Decision #14) is moot since there is no waitlist to model.

## 26. Tokenized link expiration

**Question.** Do session note share links and review request links expire, and can an owner revoke one manually?

**Answer.** Not yet decided, the founder did not have a clear answer and this is deferred to be figured out later. This stays an open item, it is not resolved by this round.

## 27. Booking page addressing

**Question.** Does each owner get a unique subdomain or path for their hosted booking page?

**Answer.** No unique subdomain per owner. Each owner's booking experience is a widget that lives within a single shared booking domain/page, not a separate subdomain per business. The goal is to keep this as simple as possible rather than standing up per-owner infrastructure for addressing.

## 28. Data export format on account offboarding

**Question.** What format and process does the data export use when an account is shut down (per round 1 Decision #11)?

**Answer.** CSV export, available anytime, not just at the moment of offboarding. This suggests export should be a standing feature available to any active owner as well as part of the offboarding flow, not a one-time event that only fires on shutdown.

## Items still open after this round

- Tokenized link expiration and revocation (Decision #26), explicitly deferred.
- Stripe/Square feature parity (Decision #21), believed equivalent but not verified.
- Apple Calendar is fully out of scope now, no longer an open question. This is a closed decision, not deferred.
- Waitlist is fully removed, not deferred. References are removed rather than tracked as pending.

## Changes this round makes to existing documents

Applied in this pass:

- [`02-prd.md`](../02-prd.md): Apple Calendar removed as an availability source; Google Calendar only. Client-facing conflicts show the slot as unavailable, with no override/dismiss popup. Waitlist removed from Core Features, the Pro-tier pricing line, and the data model (no Waitlist entity question carried forward). SMS number strategy is Twilio subaccounts, committed, not an open risk. Platform SaaS subscription billing (always to the founder) is distinguished from the owner's connected Stripe/Square account (client payments only).
- [`backlog.md`](../backlog.md): S8 (waitlist auto-fill) marked cut.
- ERD / database section in the PRD: role and login distinction for owner versus staff; phone-number normalization on Client; Waitlist entity question dropped.
