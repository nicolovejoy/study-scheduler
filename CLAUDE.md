# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Study Scheduler — a Next.js app that helps college students estimate assignment time using AI and auto-schedule study blocks into their week.

## Commands

Build: `npx next build`
Dev server: `npm run dev`
Lint: `npm run lint`

Test: `npm test` (vitest)
Test watch: `npm run test:watch`

## Architecture

- **Next.js 16 App Router** with TypeScript and Tailwind CSS
- **4 pages:** `/` (dashboard), `/add` (assignment form), `/availability` (weekly grid), `/schedule` (calendar view)
- **AI estimation:** `/api/estimate` route uses Vercel AI SDK (`generateText` + `Output.object()`) with `@ai-sdk/anthropic` (claude-sonnet-4-6) to estimate assignment duration from pasted text
- **Scheduling:** `src/lib/scheduler.ts` — greedy algorithm sorts assignments by due date and fills earliest available 30-minute slots. Skips slots that have already passed. Flags assignments as "at risk" when not enough time before due date
- **Auth:** Firebase Auth with Google Sign-in (`src/lib/auth.tsx`). `AuthGate` component blocks unauthenticated access
- **Storage:** Firestore with user-scoped subcollections (`users/{uid}/assignments`, `users/{uid}/availability`) via `src/lib/storage.ts`
- **Calendar import:** `/api/parse-schedule` route uses AI to extract free study windows from a calendar screenshot (uploaded on `/availability` page)
- **Calendar:** `react-big-calendar` with `dayjs` localizer on the `/schedule` page. Study blocks are blue, busy blocks are gray

## Infrastructure as Code

We manage infrastructure configuration (Firestore rules, etc.) as checked-in files rather than clicking through web consoles. This means settings live in the repo (e.g., `firestore.rules`, `firebase.json`), are reviewed in PRs like any other code change, and are deployed via CLI commands. If a new service needs configuration, define it in a file and deploy it from the terminal — don't configure it manually in a dashboard.

## Key conventions

- Client components use `"use client"` directive — all pages are client-rendered except the API route
- The `Availability` type is `AvailabilityBlock[]` — each block has `day: Day`, `start` (24h HH:MM), and `end` (see `types.ts`)
- The `ANTHROPIC_API_KEY` env var must be set for the AI estimation route to work
- Six `NEXT_PUBLIC_FIREBASE_*` env vars configure Firebase (set in Vercel, pulled locally with `vercel env pull`)

## Next steps

- Add feedback loop: report actual time after completing an assignment
- Expand test coverage beyond scheduler (e.g., storage utils, component tests)
- Add overlap detection for availability blocks on the same day

## Out of scope (planned for later)

Google Calendar sync (live API), sharing/groups, resource recommendations, preferences (strengths/weaknesses)
