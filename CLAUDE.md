# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # preview production build
```

## Stack

- **Vite + React 19 + TypeScript** (`verbatimModuleSyntax` is on — always use `import type` for type-only imports)
- **Mantine v8** for UI — use Mantine components throughout, avoid custom CSS
- **Firebase 12**: Auth (Google Sign-In) + Firestore (no backend functions)

## Architecture

```
src/
  firebase.ts            # Firebase app, auth, db exports
  types.ts               # Shared types: BabyName, UserScore, RankedName, Gender
  context/AuthContext.tsx # Auth state + allUsers list (live-synced from /users collection)
  hooks/
    useAuth.ts           # Reads AuthContext
    useNames.ts          # CRUD for /names collection
    useVote.ts           # ELO vote logic → writes /userScores + /matches
    useRanking.ts        # Builds myRanking + combinedRanking from /userScores
  lib/
    elo.ts               # Pure ELO math (K=32)
    weightedRandom.ts    # pickTwo() — weighted by 1/(matches+1)
  pages/
    LoginPage.tsx
    AddNamesPage.tsx     # Tab 1: suggest names (male/female)
    VotePage.tsx         # Tab 2: ELO duels
    RankingPage.tsx      # Tab 3: ranking with per-user + combined views
  App.tsx                # AppShell + 3-tab nav
  main.tsx               # MantineProvider + AuthProvider mount
```

## Firestore Data Model

- `/names/{nameId}` — shared across all users; `gender: 'male'|'female'`
- `/userScores/{userId}_{nameId}` — per-user ELO; `eloScore`, `wins`, `losses`, `matches`
- `/matches/{matchId}` — audit log of each vote
- `/users/{userId}` — profile, written on first login; used for combined ranking labels

**Combined ranking** = client-side average of all `userScores` per name (fine for 2–5 users).

## Firestore Rules & Indexes

`firestore.rules` — enforces that users can only write their own scores/matches.
`firestore.indexes.json` — composite indexes for gender+addedAt, userId+gender, gender+eloScore queries.

## Firebase Project

Project ID: `babyname-e092d`
Deploy: `firebase deploy --only firestore` (rules + indexes), `firebase deploy --only hosting` (frontend).
