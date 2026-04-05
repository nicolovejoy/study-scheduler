# CLAUDE.md

## Developer context

The developer is new to software engineering. Always explain decisions clearly and avoid jargon without explanation.

Never commit directly to `main`. Always create a feature branch and open a PR.

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
- **Scheduling:** `src/lib/scheduler.ts` — greedy algorithm sorts assignments by due date and fills earliest available 1-hour slots. Flags assignments as "at risk" when not enough time before due date
- **Storage:** All state (assignments, availability grid) lives in localStorage via `src/lib/storage.ts`. No database, no auth
- **Calendar:** `react-big-calendar` with `dayjs` localizer on the `/schedule` page. Study blocks are blue, busy blocks are gray

## Key conventions

- Client components use `"use client"` directive — all pages are client-rendered except the API route
- The `AvailabilityGrid` type is `Record<string, boolean>` keyed by `"dayname-hour"` (e.g., `"monday-14"`)
- The `ANTHROPIC_API_KEY` env var must be set for the AI estimation route to work

## Out of scope (planned for later)

File upload/PDF parsing, Google Calendar sync, user accounts, database, resource recommendations, preferences (strengths/weaknesses)
