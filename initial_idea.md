# Claude Code Prompt: Max's Study Scheduler MVP

Create a Next.js app (App Router, TypeScript, Tailwind) for a study scheduler. Deploy to Vercel.

## What it does

Student pastes an assignment description, an LLM estimates how long it'll take, student marks when they're free, and the app slots study blocks into a weekly calendar view. That's the whole MVP.

## Core flow

1. **Add assignment:** Text input (paste or type assignment description), due date picker, submit
2. **AI estimate:** Hit an API route that sends the text to Claude via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), get back `{ estimatedMinutes: number, reasoning: string }` using `generateObject` with a Zod schema
3. **Assignment list:** Shows all assignments with their estimates and due dates, sorted by due date
4. **Availability:** Simple weekly grid where the student clicks to toggle time slots as "available" (1-hour blocks, 7am-11pm, Mon-Sun)
5. **Schedule:** Button that runs a scheduling function — sorts assignments by due date, fills available slots with study blocks, displays result in a weekly calendar

## Calendar

Use `react-big-calendar` with `dayjs` as the localizer. Week view by default. Show two event types visually distinct: "busy" (class times, commitments the student marks) and "study" (auto-scheduled blocks). Color code them.

## Scheduling logic

Keep it simple. Sort assignments by due date (earliest first). For each assignment, fill the earliest available slots until the estimated time is covered. Don't schedule study blocks past the due date. If there isn't enough time, flag the assignment as "at risk."

## Storage

localStorage for everything. No database, no auth. Store assignments, availability grid, and generated schedule as JSON. Persist across page reloads.

## AI prompt

The system prompt for time estimation should say something like: "You are a study time estimator for college students. Given an assignment description, estimate how many minutes it will take an average college student to complete. Be realistic — students tend to underestimate. Return your estimate and a brief reasoning."

## Pages

```
/              → Dashboard: assignment list + "Schedule my week" button
/add           → Add assignment form with AI estimate
/availability  → Weekly availability grid
/schedule      → Weekly calendar view (react-big-calendar) showing the generated schedule
```

Simple nav across all pages. Mobile responsive.

## Dependencies

- next, react, typescript, tailwind (standard Next.js setup)
- ai, @ai-sdk/anthropic (Vercel AI SDK for the LLM call)
- react-big-calendar (weekly calendar view)
- dayjs (date handling + calendar localizer)
- zod (schema for AI structured output)

## Out of scope

- Google Calendar sync
- File upload / PDF parsing
- User accounts / auth
- Database
- Resource recommendations
- Feedback loop (reporting actual time)
- Preferences (strengths/weaknesses, break patterns)

All of those are planned for later. Don't build toward them — just build the MVP clean.
