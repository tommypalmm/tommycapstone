# Founder Decisions, Round 3

**Date.** October 8, 2026
**Decided by.** Tommy Brown (founder)
**Applies to.** [`02-prd.md`](../02-prd.md), [`0004-mvp-build-choices.md`](0004-mvp-build-choices.md)

These settle the open questions raised during the first build and the go-live setup.

## 29. Simultaneous confirms of the same slot (confirms Decision #19)

**Decision.** Reject both. When two clients confirm the same staff and time at the same moment, neither is booked, and both are told to try again.

**Built.** Online confirms within 1.5 seconds of each other for the same staff and start time are all rejected. Later confirms hit the unique index, so the first one wins. See 0004 §32.

## 30. Logins

**Decision.** Keep the app's own email and password logins. Do not move to Supabase Auth. Business owners also need **Sign in with Google** and a **forgot password** flow.

**Why.** The logins already work and enforce owner and staff roles on the server (Decision #22). Owners already connect Google Calendar, so a Google sign-in suits them.

**Still to build.** Google sign-in and password reset.

## 31. Rebook suppression scope (closes the Decision #14 question)

**Decision.** Skip a rebook nudge if the client has **any** future appointment, with any service. This is the rule already built (0004 §34).

## 32. Product name (closes Decision #1)

**Decision.** The product is **PetProOS**.

## 33. Deferred by the founder

- **Twilio.** Texts run on the founder's existing Twilio account for now. The production Twilio setup (one brand and campaign, a subaccount per owner, Decision #24) comes later.
- **Stripe.** Client payments (Decision #9) and the founder's SaaS billing come later.
- **Custom domain.** Later. Until then the app runs at `tommycapstone-livid.vercel.app`. Google OAuth verification waits on the domain.
