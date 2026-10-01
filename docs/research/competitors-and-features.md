# Competitors and features

**Date.** Sep 18, 2026
**Question.** Can one studio OS stand out with SMS, reviews, loyalty — or is that already table stakes?

## Landscape (pilates / boutique)

| Product | Price ballpark (2026 public/reviews) | Notes |
|---------|--------------------------------------|--------|
| Mindbody | Starter ~$79–159; Accelerate ~$259–279; Ultimate ~$499–699 / location | Marketplace ~20% (cap $30) on app-discovered clients; processing ~2.99% present / ~3.6% on stored cards; SMS mostly Ultimate / Attentive |
| Momence | ~$199–599+; branded app extra | Processing ~3.9% online (often more than the seat). Hidden quote. |
| Walla | Lite $199; Core $320; Pro $599 | Two-way SMS +$100 or in Pro. App +$149 or in Pro. Stripe 2.9%. Floor is established studios. |
| WellnessLiving | $69 / $199 / $349 | Loyalty at Business $199. SMS notifications even on Starter; marketing SMS higher. |
| Mariana Tek | Quote, premium | Branded app, pick-a-spot, enterprise onboarding weeks |
| StudioGrowth | $159 / $250 / $350 | SMS on Bloom; two-way + sequences on Harvest $350 |
| PushPress | Mid; app included | Review SMS, reformer caps, ~2 week migration pitch |
| Arketa | Solo cheap; studio quoted | Strong pilates/Lagree spots; recovery rooms |
| Spokk | Add-on, not a scheduler | Post-class SMS, AI reviews, milestone loyalty |
| TeamUp, Glofox, SIXPAC, Acuity | Various | Acuity is not a class/pack OS |

Mindbody complaints (forums/reviews): annual price hikes, marketplace tax on Instagram-originated clients, clients seeing other studios in the app, weak reporting, lock-in.

## Table stakes (must have or you are not a studio product)

- Recurring classes, instructor, capacity
- **Reformer/spot inventory**, not only room cap
- Waitlist auto-offer + timer
- Packs, memberships, drop-ins, intro offers
- Late cancel / no-show that actually charges
- Recurring billing + failed-card retry
- Mobile booking + waiver + check-in
- Client credits and notes
- Fill rate + revenue by product + failed payments

## Will not stand out (already sold or upsold)

- “We have SMS” — gated on expensive plans, but the *idea* is everywhere
- Punch-card loyalty — WellnessLiving $199
- Review texts — Spokk / Podium / Birdeye
- Branded native app — Mariana/Walla/Momence premium
- AI receptionist, VOD, ClassPass

## Can stand out (build on purpose)

1. **Honest price, no marketplace.** Month-to-month ~$149–249. Stripe standard rates. Ad: “They found you on Instagram. Why is Mindbody taking a cut?”
2. **Automations on by default**, skip-logic, two-way inbox — not Harvest/Pro/Ultimate.
   - Reminders, waitlist offer, intro/waiver, failed card, pack expiry, one 14-day winback
   - Review only after **attendance**; 5★ → Google; 1–3★ owner only
3. **SMS included + A2P 10DLC** as ISV (Twilio ~$0.008/segment + campaign fees). Budget into the plan.
4. **Real reformer floor** (out-of-service machine drops capacity).
5. **Unfair Palmm wedge (later):** IG lead → intro hold → showed → membership. Report cost per intro. Don’t become their ads agency; instrument the funnel.
6. **Switching:** CSV/concierge pack-balance import. Fear of migration is the real objection.

Loyalty = a 10th-class SMS, not a product name.

## SMS cost note

US A2P 10DLC required. Unregistered traffic gets filtered/fees. Each studio is a brand/campaign under the ISV. Inbox needs inbound webhooks, not fire-and-forget.

## Sources

- Vendor pricing pages (Mindbody, WellnessLiving, Walla reviews on pilatesstudiosoftware.com)
- Mat Track Mindbody pricing explainer (Jun 2026)
- QuantumByte pilates feature matrix (waitlists, packs, apparatus)
- Spokk pilates SMS/loyalty pages
- Twilio US SMS + A2P 10DLC docs
