# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session startup

At the start of every session, before doing any work:
1. Run `git fetch origin && git status` to check for remote changes
2. Run `git pull origin main` to pull the latest main
3. Review recent commits with `git log --oneline -10` to understand what changed

This keeps the working context in sync and avoids building on stale code.

## Project

Study Scheduler — a Next.js app that helps college students estimate assignment time using AI and auto-schedule study blocks into their week.

## Commands

Build: `npx next build`
Dev server: `npm run dev`
Lint: `npm run lint`

Test: `npm test` (vitest)
Test watch: `npm run test:watch`

## Architecture

- **Next.js App Router** with TypeScript and Tailwind CSS
- **4 pages:** `/` (dashboard), `/add` (assignment form), `/availability` (weekly grid), `/schedule` (calendar view)
- **Auth:** Firebase Auth with Google Sign-in (`src/lib/auth.tsx`). `AuthGate` component blocks unauthenticated access
- **Storage:** Firestore with user-scoped subcollections (`users/{uid}/assignments`, `users/{uid}/availability`) via `src/lib/storage.ts`. All functions are async and take `uid` as first argument
- **Data fetching:** SWR hooks in `src/lib/hooks.ts` (`useAssignments`, `useAvailability`, `useStudyTimePreference`). Mutations go through `mutateXxx` functions in the same file
- **AI estimation:** `/api/estimate` route uses Vercel AI SDK (`generateText` + `Output.object()`) with `@ai-sdk/anthropic` (claude-sonnet-4-6)
- **Scheduling:** `src/lib/scheduler.ts` — greedy algorithm fills 30-minute slots within availability blocks, sorted by due date. Flags assignments as "at risk" when not enough time remains
- **Availability:** Stored as `AvailabilityBlock[]` — array of `{ id, day, start, end }` with 24h HH:MM strings
- **Study time preference:** `StudyTimePreference` type (`"morning" | "afternoon" | "evening" | "none"`) stored per user in Firestore under `preferences/studyTime`
- **Calendar:** `react-big-calendar` with `dayjs` localizer on `/schedule`. Study blocks are blue, busy blocks are gray

## Infrastructure as Code

We manage infrastructure configuration (Firestore rules, etc.) as checked-in files rather than clicking through web consoles. Settings live in the repo (`firestore.rules`, `firebase.json`), are reviewed in PRs, and deployed via CLI. Don't configure manually in dashboards.

## Key conventions

- Client components use `"use client"` directive — all pages are client-rendered except API routes
- Always get the current user from `useAuth()` and pass `user.uid` to storage/hook functions
- The `ANTHROPIC_API_KEY` env var must be set for the AI estimation route to work
- Six `NEXT_PUBLIC_FIREBASE_*` env vars configure Firebase (set in Vercel, pulled locally with `vercel env pull`)

## Git workflow

- Never commit directly to `main` — always branch and open a PR
- Branch naming: `feat/`, `fix/`, `chore/` prefixes

<!-- SHARED-CONVENTIONS:BEGIN v=d5e16e653242 — auto-managed, do not edit here; source: prompt-lab/workflow/claude-md-shared.md (edit + re-sync) -->
## Shared conventions

<!-- These are Nico's cross-repo output rules. They're materialized into each repo's
CLAUDE.md so every agent (local, cloud, third-party) sees them as plain text. Source
of truth: prompt-lab/workflow/claude-md-shared.md — edit there and re-sync, never here. -->

- **Clickable URLs.** When pointing at any web destination (dashboard, repo, PR, deploy, settings, docs, localhost), print the full bare URL — `https://example.com` or `http://localhost:8080` — on its own, never just the page's name and never a markdown `[label](url)` link. Nico's terminal auto-linkifies raw `https://` text, so a bare URL is one-click and stays copyable.

- **Number your questions.** Any time you ask Nico more than one question, present them as a numbered list (1., 2., 3.) so he can answer by number with no ambiguity. A single standalone question needs no number.

- **Self-contained smoke-test instructions.** When you ask Nico to manually test or verify an app or website, assume zero carried-over context — he should never scroll back or recall a URL/path/credential from earlier. Always include: the exact URL (full `https://…` or `http://localhost:…`, restated even if mentioned above), the precise steps in order, and what a pass vs. fail looks like. Repetition here is a feature, not clutter.

- **No marker before a copy-paste command block.** Nico's terminal renders markdown bullets (`-`, `*`, `•`) as `●`, which breaks paste into zsh. The line directly above a fenced command block must be a plain-text label ending in a colon — never a bullet, dash, asterisk, or number. For loud copy targets, lead the label with `📋` + bold `COPY THE BELOW`, then a colon, then the block.
<!-- SHARED-CONVENTIONS:END -->
