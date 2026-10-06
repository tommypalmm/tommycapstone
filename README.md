# PetPro OS

**What it is.** A web app that runs the business side of an independent dog trainer's or
groomer's day. Clients book online through an embeddable page or share link, availability comes
from the owner's Google Calendar, automated texts cut no-shows, and past clients get nudged to
rebook. Sold on a flat monthly subscription, acquired through Meta ads.

**Who it's for.** Solo or 2–4 person owner-operator dog trainers and groomers who run the
business from their phone on texts, phone tag, and a paper book. The customer is the pet pro,
not the pet owner.

**Live URL.** Not deployed yet.

## How to run it

Needs Node 20+. No database or API keys required locally: data lives in an embedded Postgres
(PGlite) under `.data/`, and texts are simulated (logged on the **Texts** page, not delivered).

```bash
git clone https://github.com/tommypalmm/tommycapstone.git
cd tommycapstone
npm install
cp .env.example .env.local   # optional; every setting has a local default
npm run dev
```

Open http://localhost:3000/signup, then:

1. **Settings** → set hours and a booking interval, then add a service under **Services**. The
   booking page stays closed until these are set.
2. Open the booking link from **Settings** in a private window and book as a client.
3. Back in the app: the booking is on **Today**, and the confirmation text is on **Texts**. Use
   **Simulate a client reply** there to try `C` (confirm), `X` (cancel), `STOP`, and `START`.

To go live, set these in `.env.local` (see [`.env.example`](.env.example)):

- `DATABASE_URL`: Supabase/Postgres connection string. Tables are created on first start.
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: real texts. Each owner's subaccount SID and number go
  in **Settings → Texting**. Point the number's inbound webhook at `/api/sms/inbound`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google Calendar connect under **Settings → Staff**.
- `JOB_TICKER=off` + `CRON_SECRET`: on serverless hosts, call `/api/cron/tick` every minute instead
  of the in-process reminder ticker.

Product docs: [`docs/01-concept-brief.md`](docs/01-concept-brief.md), the PRD in
[`docs/02-prd.md`](docs/02-prd.md) (PDF: [`docs/exports/dog-pro-portal-prd.pdf`](docs/exports/dog-pro-portal-prd.pdf)),
and build choices in [`docs/decisions/0004-mvp-build-choices.md`](docs/decisions/0004-mvp-build-choices.md).

## Repo layout

```
.
├── README.md                 what it is, who it's for, live URL, how to run it
├── CLAUDE.md                 standing context for the agent
├── package.json              Next.js 16 app; `npm run dev` / `npm run build`
├── .env.example              optional settings (database, Twilio, Google, cron)
│
├── src/
│   ├── app/                  pages and routes
│   │   ├── app/              owner/staff portal (Today, bookings, clients, texts, settings)
│   │   ├── book/             public booking page (shared domain, ?b=<business>)
│   │   ├── c/[token]/        client manage/cancel link from texts
│   │   ├── n/[token]/        client session-notes link
│   │   ├── embed.js/         one-snippet website embed
│   │   └── api/              SMS webhook, cron tick, Google OAuth
│   ├── lib/                  db, migrations, availability, bookings, jobs, sms, calendar, auth
│   └── components/           shared UI (empty/error states, hours editor)
│
└── docs/
    ├── 01-concept-brief.md   CP-M1 · Sep 9
    ├── 02-prd.md             CP-M2 · Sep 27
    ├── 03-architecture.md    CP-M3 · Oct 11
    ├── backlog.md            Lab 3 — stories, acceptance criteria, MoSCoW
    │
    ├── research/             what real people told me, plus market research
    │   ├── README.md
    │   ├── discovery-log.md
    │   ├── interview-01.md
    │   ├── interview-02.md
    │   ├── market-and-niches.md
    │   ├── competitors-and-features.md
    │   ├── boutique-studio-niches.md
    │   ├── meta-gtm-and-unit-economics.md
    │   ├── grand-prix-scheduler-lessons.md
    │   └── productization-session/
    │
    ├── design/               what it should look like and why
    │   ├── ui-notes.md
    │   └── wireframes/
    │
    ├── decisions/            why I chose what I chose
    │   ├── 0001-example.md
    │   ├── 0002-cp-m2-founder-decisions.md
    │   ├── 0003-cp-m2-founder-decisions-round-2.md
    │   └── 0004-mvp-build-choices.md
    │
    └── exports/              PDF exports of docs
        └── dog-pro-portal-prd.pdf
```

Coming later: `tests/` (unit + Playwright, Week 13) and `.github/workflows/` (CI/CD, Week 14).
