# Capstone

**What it is.**

**Who it's for.**

**Live URL.**

## How to run it

Docs only until Week 9. No `src/` yet.

```bash
git clone <repo-url>
cd <repo-name>
```

Start with [`docs/01-concept-brief.md`](docs/01-concept-brief.md).

## Repo layout

```
.
├── README.md                 what it is, who it's for, live URL, how to run it
├── CLAUDE.md                 standing context for the agent
│
├── docs/
│   ├── 01-concept-brief.md   CP-M1 · Sep 9
│   ├── 02-prd.md             CP-M2 · Sep 27
│   ├── 03-architecture.md    CP-M3 · Oct 11
│   ├── backlog.md            Lab 3 — stories, acceptance criteria, MoSCoW
│   │
│   ├── research/             what real people told you
│   │   ├── interview-01.md
│   │   └── interview-02.md
│   │
│   ├── design/               what it should look like and why
│   │   ├── ui-notes.md
│   │   └── wireframes/       photos of sketches are fine
│   │
│   └── decisions/            why you chose what you chose
│       └── 0001-example.md
│
├── src/                      the application — from Week 9
├── tests/                    unit + Playwright — from Week 13
└── .github/workflows/        CI/CD — from Week 14
```

`src/`, `tests/`, and `.github/workflows/` are not created yet. Don't add them early.
