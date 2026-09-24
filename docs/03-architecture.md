# 03 · Architecture

**Milestone.** CP-M3 · Oct 11
**Status.** Not started
**Input.** [`02-prd.md`](02-prd.md), [`decisions/0002-cp-m2-founder-decisions.md`](decisions/0002-cp-m2-founder-decisions.md), [`decisions/0003-cp-m2-founder-decisions-round-2.md`](decisions/0003-cp-m2-founder-decisions-round-2.md)

## Overview


## Users and surfaces


## System diagram


## Data model


## Auth


## Key flows


## Stack


## What we are not building

- Apple Calendar. Google Calendar only, full read and write.
- Waitlist auto-fill (S8). Cut, not deferred. No Waitlist entity.
- Per-owner booking subdomains. One shared booking domain, widget per owner.
- A pre-booking hold step in the UI.
- A single shared Twilio number. One brand/campaign, subaccount per owner.

## Open questions

- Tokenized link expiration and revocation (session-note share links and review-request links). Deferred (Decision #26).
- Stripe/Square feature parity for package billing and refunds. Believed equivalent, not verified. Do not finalize the processor abstraction until confirmed (Decision #21).
- Rebook-suppression scope, job-queue engine, and RLS policy design (Decision #14). Waitlist modeling is closed.
