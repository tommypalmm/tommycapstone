# 0002 · Founder decisions log (CP-M2 PRD review)

**Source.** CP-M2 PRD review, capturing open questions and founder answers before CP-M3 architecture.
**Date.** September 23, 2026
**Status.** Draft, feeds into [`03-architecture.md`](../03-architecture.md)

This document is a direct Q&A transcript. Questions were raised during PRD review of the CP-M2
draft. Answers are the founder's decisions as given. Use alongside [`02-prd.md`](../02-prd.md) as
build input for Cursor.

## 1. Naming
**Q.** Is the product name locked before CP-M3, or do we build under a placeholder and rename later?
**A.** Build under a placeholder now. Rename later. Do not block architecture or code on the final name.

## 2. Vertical scope
**Q.** Is grooming or training the lead vertical for launch, or genuinely co-equal? Is the exact
Starter/Pro/Team feature split final?
**A.** Both grooming and training launch together, not sequenced. Tier boundaries are not final
(expect all three tiers to shift, tracked as backlog B1). Do not hardcode tier gates; build the
gating mechanism config-driven so tier contents can change without a schema migration.

## 3. Owner availability
**Q.** How is owner availability actually defined?
**A.** Sourced from the owner's own calendar, not a custom scheduler. Owners connect Google or
Apple Calendar; the system scans busy blocks to derive open slots. Owners without a calendar can
get a fresh one created inside the platform's flow.
**Implication.** External calendar sync is a core MVP dependency, a first-class integration
alongside Twilio and Stripe, not optional.

## 4. Staff capacity and buffer time
**Q.** How does the system handle staff capacity when multiple staff work in parallel?
**A.** Multiple staff, each with their own hours; book different staff at different times or the
same slot across different staff (normal multi-provider booking). Buffer time between bookings is
configurable per owner in settings.

## 5. Double-booking conflicts across calendars
**Q.** What happens on a conflict between an external calendar event and a Studio-side booking?
**A.** Each staff member's bookings write to their own connected calendar. On conflict, the system
surfaces a popup so the owner/staff can override or dismiss. Default resolution favors the
Studio-side booking when overridden.

## 6. SMS number strategy and A2P 10DLC ownership
**Q.** Who owns A2P 10DLC registration, and can a single Twilio number serve every owner account?
**A.** The founder owns A2P 10DLC registration directly. Stated plan: one shared number across all
owner accounts. Overage beyond the fair-use text cap bills automatically.
**Flag (real decision, not a note).** A single shared number across many unrelated businesses is a
known A2P 10DLC problem: carriers/Twilio expect one brand + one campaign per distinct business use
case; mixing many unrelated businesses behind one sender gets throttled, delisted, or rejected in
vetting, and all owners share one deliverability reputation. Scalable path: Twilio subaccounts with
a shared brand registration and per-owner (or pooled) campaigns, often via a reseller/ISV program.
This is a CP-M3 decision; resolve before locking the Twilio design, since retrofitting number
architecture after owners are live is disruptive.

## 7. Booking cutoff window
**Q.** What if a booking is made less than 24 hours before the appointment?
**A.** Not allowed. Hard cap: the booking flow blocks self-serve bookings under 24 hours out.

## 8. Keyword reply fallback (unresolved)
**Q.** What is the fallback for an SMS reply that doesn't match a known keyword (confirm, cancel, STOP)?
**A.** Open. Ties to the number/campaign-provisioning question in item 6.
**Recommendation.** Any unrecognized reply triggers a single automatic fallback message pointing
the client to a human contact path (a link or the owner's number), logged like confirms/cancels so
nothing silently disappears. Decide together with item 6.

## 9. Payment processor choice
**Q.** Is Stripe the only supported payment processor?
**A.** No. Owners can choose Stripe or Square. Needs a processor abstraction in the service layer,
and the Payment entity needs a processor field rather than assuming Stripe.

## 10. Deposit, package, and cancellation policy (core differentiator)
**Q.** What is the deposit refund and cancellation behavior?
**A.** The platform does not dictate deposit, refund, bundle, or cancellation policy. Every owner
configures these to match how their business already operates; the platform provides the settings
layer and enforces the owner's config. Belongs in the PRD as a differentiator ("hard to say no
to") and a goal; cancellation/deposit rules live as configurable fields on Account or Service, not
hardcoded logic.

## 11. Failed subscription payment and account shutdown
**Q.** What happens when an owner's subscription payment fails repeatedly?
**A.** If the account is shut down, the flow must guarantee no platform liability for the owner's
data, active bookings, or client obligations: a defined offboarding state (data export window,
booking page taken down cleanly, no orphaned scheduled jobs still sending reminders).

## 12. Meta Pixel and Meta ads scope
**Q.** Is Meta CAPI event taxonomy/attribution in scope for the current build?
**A.** Not yet, Meta ads are a later upsell. But embed a Meta Pixel by default on every owner's
public booking widget (it functions as the landing page). Build pixel placement now; defer CAPI
event logic and conversion taxonomy.

## 13. Review verification
**Q.** Does the platform verify a review request resulted in a posted review?
**A.** No. It sends the request and marks it sent; it does not verify a review was left. Status
tracking is limited to whether the request was dispatched.

## 14. Items flagged unclear (follow-up before CP-M3)
- **Waitlist as a data entity.** Model a waitlisted client as a Booking with a waitlisted status,
  or as its own entity? Decides how claim windows/expiration work.
- **Rebook suppression scope.** Suppress the nudge on any future appointment for the client, or
  only for the same client + same service? Needs a founder call based on grooming vs training.
- **Conversion events for leads that never book.** Should a Lead that never books still fire a
  top-of-funnel Meta signal? Revisit when Meta CAPI work starts (item 12).
- **Job queue choice.** n8n (external dependency + hosting) vs Supabase scheduled functions
  (one platform). Decide at CP-M3; reminders/nudges/waitlist all depend on it.
- **Row-level security policy design.** Draft the RLS policies with the schema at CP-M3; don't
  retrofit.
- **Environments before production.** Sandbox/staging for Twilio, Stripe/Square, and calendar so
  integration testing never hits live owner accounts or live SMS.

## 15. General principle: platform provides infrastructure, owner configures business logic
**Q.** How should time zone handling, cancellation rules, and other business-specific behavior be
decided?
**A.** A platform-wide principle: the platform provides the foundation (scheduling, reminders,
payments, records); every business-specific behavior (time zone display, cancellation rules,
deposit policy, rebooking cadence) is an owner-configured setting. State once, clearly, as a design
principle in the PRD.

## Summary of items that block CP-M3 architecture
- Item 3: calendar sync is a first-class integration, not optional.
- Item 6: SMS number / A2P 10DLC strategy needs a real decision (shared number is a compliance risk).
- Item 8: keyword-reply fallback and number provisioning are the same decision as item 6.
- Item 9: Stripe/Square dual support needs a processor abstraction.
- Item 14: waitlist modeling, rebook suppression scope, job queue (n8n vs Supabase), and RLS design
  must be resolved in [`03-architecture.md`](../03-architecture.md).
