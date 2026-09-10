# 01 · Concept brief

**Milestone.** CP-M1 · Sep 9
**Status.** Draft

## Working title

**Palmm OS** — a backend system that runs the whole business. (Name can change;
"The Pitch" is on the table too.)

## One sentence

A single backend system that manages all the moving parts of my
consulting/marketing business — and the daily life around it — so my partner and
I run everything from one place instead of a pile of spreadsheets and task apps.

## Who it's for

Me and my business partner — the two people actually operating the business. We
juggle client work, deadlines, follow-ups, money, and personal to-dos across too
many tools, usually from a laptop but often from a phone between meetings. We're
power users: we'd rather configure something once and have it run than click
through a generic app every day.

The honest first user is us. That's the point — we live inside this problem every
day, so we'll know immediately whether it actually saves us time.

## The job it does

When I have tasks due for the business, I want to get them done the most
efficient way possible, so I can make money and feel satisfied that nothing is
slipping.

## Current workaround

Spreadsheets and a general task manager, stitched together by hand. Things live
in different places — a sheet here, a task app there, a note somewhere else — so
staying on top of it is its own job, and things still fall through the cracks.

## Why this, why now

I already run the business, so I'm not guessing at the problem — I feel it daily
and can test against real work. And the tooling finally makes a custom internal
system realistic to build solo: AI coding in Cursor, LLMs to handle the fuzzy
parts, and APIs/automation to wire the moving pieces together.

## In scope

MVP — start with the core loop, not "everything at once":

- One place that collects tasks and deadlines from the business.
- Prioritizes what to do next so the most valuable/urgent work surfaces first.
- Lets my partner and me capture, assign, and complete tasks.
- Connects to a first set of tools we already use (start with one or two APIs,
  prove the pattern, then expand).
- Has a clear empty state and an error state for when a connected tool or API
  fails.

## Out of scope

- "Manages literally every aspect" on day one — that's the vision, not the MVP.
- Selling it to other businesses (this is for us first).
- Deep automations for tools we haven't connected yet.
- Anything that needs an API we can't actually get access to.

## What success looks like

My partner and I run a full week out of this system without falling back to the
spreadsheet — tasks come in, get prioritized, and get done, and at the end of the
week nothing important slipped. If we'd rather open this than our old sheet, it's
working.

## Risks

Biggest unknown: whether one system can really manage *every* aspect of the
business and daily life. That mostly comes down to access — I'm counting on
being able to get the APIs for the tools I'd need to connect, and if some of
those are closed or limited, parts of the vision won't be reachable. Scoping
that down to what's actually connectable is the first real risk.

## Stack guess

Built with **Cursor** (AI coding), on my usual stack: Next.js / React / Tailwind
for the interface, Supabase for data and auth, n8n for automations between tools,
deployed on Vercel. This is a guess — Week 7 teaches stack selection and CP-M3
is where it's decided.

## Open questions

- Which tool/API do we connect first to get the fastest real payoff?
- Is the core unit a "task," or a "workflow" that spans several tools?
- How much should the system decide for us (auto-prioritize) vs. just show us?

## Next

CP-M2 · PRD · Sep 27 — [`docs/02-prd.md`](02-prd.md)
