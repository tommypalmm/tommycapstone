# PetPro OS

**What it is.** A web app that runs the business side of an independent dog trainer's or
groomer's day. Clients book online through an embeddable page or share link, availability comes
from the owner's Google Calendar, automated texts cut no-shows, and past clients get nudged to
rebook. Sold on a flat monthly subscription, acquired through Meta ads.

**Who it's for.** Solo or 2–4 person owner-operator dog trainers and groomers who run the
business from their phone on texts, phone tag, and a paper book. The customer is the pet pro,
not the pet owner.

**Live URL.** Not deployed yet (Week 9+).

## How to run it

Docs only until Week 9. No `src/` yet.

```bash
git clone https://github.com/tommypalmm/tommycapstone.git
cd tommycapstone
```

Start with [`docs/01-concept-brief.md`](docs/01-concept-brief.md), then the PRD in
[`docs/02-prd.md`](docs/02-prd.md) (PDF: [`docs/exports/dog-pro-portal-prd.pdf`](docs/exports/dog-pro-portal-prd.pdf)).

## Repo layout

```
.
├── README.md                 what it is, who it's for, live URL, how to run it
├── CLAUDE.md                 standing context for the agent
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
    │   └── 0003-cp-m2-founder-decisions-round-2.md
    │
    └── exports/              PDF exports of docs
        └── dog-pro-portal-prd.pdf
```

Coming later: `src/` (the application, Week 9), `tests/` (unit + Playwright, Week 13), and
`.github/workflows/` (CI/CD, Week 14). Don't add them early.
