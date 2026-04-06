import { describe, it, expect } from "vitest";
import { generateSchedule } from "./scheduler";
import { Assignment, Availability } from "./types";

function makeAssignment(
  overrides: Partial<Assignment> & { id: string; title: string }
): Assignment {
  return {
    description: "test",
    dueDate: "2026-04-10",
    estimatedMinutes: 120,
    reasoning: "test",
    createdAt: "2026-04-03T00:00:00Z",
    ...overrides,
  };
}

// Monday April 6, 2026
const WEEK_START = new Date(2026, 3, 6);

// Helper: create a single availability block with a throwaway id
function block(
  day: Availability[number]["day"],
  start: string,
  end: string
): Availability[number] {
  return { id: `${day}-${start}`, day, start, end };
}

describe("generateSchedule", () => {
  it("returns empty blocks when no assignments", () => {
    const result = generateSchedule([], [], WEEK_START);
    expect(result.blocks).toEqual([]);
    expect(result.atRisk).toEqual([]);
  });

  it("returns empty blocks when no availability", () => {
    const assignments = [makeAssignment({ id: "1", title: "Ochem" })];
    const result = generateSchedule(assignments, [], WEEK_START);
    expect(result.blocks).toEqual([]);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("schedules blocks into available slots", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    // 9:00–11:00 = 4 × 30-min slots = 120 min
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual([]);
    expect(result.blocks[0].title).toBe("Ochem");
  });

  it("flags at-risk when not enough slots", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 180 }),
    ];
    // 9:00–11:00 = 120 min, not enough for 180
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("schedules earlier-due assignments first", () => {
    const assignments = [
      makeAssignment({
        id: "late",
        title: "Bio",
        dueDate: "2026-04-12",
        estimatedMinutes: 60,
      }),
      makeAssignment({
        id: "early",
        title: "Ochem",
        dueDate: "2026-04-07",
        estimatedMinutes: 60,
      }),
    ];
    // 9:00–11:00 = 4 × 30 min = 120 min (enough for both)
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks[0].title).toBe("Ochem");
    expect(result.blocks[2].title).toBe("Bio");
  });

  it("does not schedule past the due date", () => {
    const assignments = [
      makeAssignment({
        id: "1",
        title: "Ochem",
        dueDate: "2026-04-06", // Monday — only Monday slots usable
        estimatedMinutes: 180,
      }),
    ];
    // Monday 9:00–11:00 = 4 slots (120 min), Tuesday (past due) ignored
    const availability: Availability = [
      block("monday", "09:00", "11:00"),
      block("tuesday", "09:00", "10:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("does not double-book slots across assignments", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
      makeAssignment({ id: "2", title: "Bio", estimatedMinutes: 60 }),
    ];
    // 9:00–11:00 = 4 × 30-min slots, enough for both 60-min assignments
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    const starts = result.blocks.map((b) => b.start.getTime());
    expect(new Set(starts).size).toBe(4);
  });

  it("handles zero estimated minutes without creating blocks", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Easy quiz", estimatedMinutes: 0 }),
    ];
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(0);
    expect(result.atRisk).toEqual([]);
  });

  it("spreads blocks across multiple days", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Essay", estimatedMinutes: 120 }),
    ];
    // 1 hour Monday + 1 hour Tuesday = 4 slots total
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("tuesday", "09:00", "10:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual([]);

    const monBlocks = result.blocks.filter(
      (b) => b.start.getDay() === 1 // Monday
    );
    const tueBlocks = result.blocks.filter(
      (b) => b.start.getDay() === 2 // Tuesday
    );
    expect(monBlocks).toHaveLength(2);
    expect(tueBlocks).toHaveLength(2);
  });

  it("handles equal due dates by preserving input order", () => {
    const assignments = [
      makeAssignment({
        id: "a",
        title: "Ochem",
        dueDate: "2026-04-10",
        estimatedMinutes: 30,
      }),
      makeAssignment({
        id: "b",
        title: "Bio",
        dueDate: "2026-04-10",
        estimatedMinutes: 30,
      }),
    ];
    const availability: Availability = [block("monday", "09:00", "10:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].title).toBe("Ochem");
    expect(result.blocks[1].title).toBe("Bio");
  });

  it("handles multiple availability blocks on the same day", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    // Morning 9–10 + afternoon 14–15 = 4 slots
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("monday", "14:00", "15:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual([]);
    // First two in morning, last two in afternoon
    expect(result.blocks[0].start.getHours()).toBe(9);
    expect(result.blocks[2].start.getHours()).toBe(14);
  });

  it("ignores availability blocks shorter than 30 minutes", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 30 }),
    ];
    // 9:00–9:20 is less than one 30-min slot
    const availability: Availability = [block("monday", "09:00", "09:20")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(0);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("marks all at-risk when all assignments exceed availability", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
      makeAssignment({ id: "2", title: "Bio", estimatedMinutes: 120 }),
    ];
    // Only 1 hour total = 2 slots = 60 min
    const availability: Availability = [block("monday", "09:00", "10:00")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
    // Both should be at risk — first gets 60 of 120, second gets 0 of 120
    expect(result.atRisk).toContain("1");
    expect(result.atRisk).toContain("2");
  });

  it("skips slots in the past", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    // Monday 9:00–11:00 = 4 slots, but now is 10:00 Monday
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const now = new Date(2026, 3, 6, 10, 0); // Monday April 6 at 10:00
    const result = generateSchedule(assignments, availability, WEEK_START, now);
    // Only 10:00 and 10:30 slots remain (9:00 and 9:30 are in the past)
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].start.getHours()).toBe(10);
    expect(result.blocks[1].start.getHours()).toBe(10);
    expect(result.blocks[1].start.getMinutes()).toBe(30);
  });

  it("flags at-risk when past slots reduce availability below estimate", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    // Only 2 slots available but 2 are in the past → only 60 min for 120 min assignment
    const availability: Availability = [block("monday", "09:00", "11:00")];
    const now = new Date(2026, 3, 6, 10, 0);
    const result = generateSchedule(assignments, availability, WEEK_START, now);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("does not filter slots on future days", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
    ];
    // Now is Monday 10:00 — Tuesday 9:00 should still be available
    const availability: Availability = [block("tuesday", "09:00", "10:00")];
    const now = new Date(2026, 3, 6, 10, 0);
    const result = generateSchedule(assignments, availability, WEEK_START, now);
    expect(result.blocks).toHaveLength(2);
    expect(result.atRisk).toEqual([]);
  });

  it("generates correct 30-min slot boundaries", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 90 }),
    ];
    const availability: Availability = [block("monday", "09:00", "10:30")];
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].start.getMinutes()).toBe(0);
    expect(result.blocks[0].end.getMinutes()).toBe(30);
    expect(result.blocks[1].start.getMinutes()).toBe(30);
    expect(result.blocks[1].end.getMinutes()).toBe(0);
    expect(result.blocks[2].start.getMinutes()).toBe(0);
    expect(result.blocks[2].end.getMinutes()).toBe(30);
  });

  it("prioritizes morning slots when preference is morning", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
    ];
    // Morning 9–10 and evening 18–19 both available
    const availability: Availability = [
      block("monday", "18:00", "19:00"),
      block("monday", "09:00", "10:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START, new Date(0), "morning");
    expect(result.blocks).toHaveLength(2);
    // Should pick morning slots first
    expect(result.blocks[0].start.getHours()).toBe(9);
    expect(result.blocks[1].start.getHours()).toBe(9);
  });

  it("prioritizes evening slots when preference is evening", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
    ];
    // Morning 9–10 and evening 18–19 both available
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("monday", "18:00", "19:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START, new Date(0), "evening");
    expect(result.blocks).toHaveLength(2);
    // Should pick evening slots first
    expect(result.blocks[0].start.getHours()).toBe(18);
    expect(result.blocks[1].start.getHours()).toBe(18);
  });

  it("falls back to non-preferred slots when preferred are full", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    // Only 1 hour in afternoon, 1 hour in morning
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("monday", "14:00", "15:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START, new Date(0), "afternoon");
    expect(result.blocks).toHaveLength(4);
    expect(result.atRisk).toEqual([]);
    // Afternoon slots first, then morning
    expect(result.blocks[0].start.getHours()).toBe(14);
    expect(result.blocks[1].start.getHours()).toBe(14);
    expect(result.blocks[2].start.getHours()).toBe(9);
    expect(result.blocks[3].start.getHours()).toBe(9);
  });

  it("preserves day order with preference (does not pull later days forward)", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
    ];
    // Tuesday evening and Monday morning
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("tuesday", "18:00", "19:00"),
    ];
    const result = generateSchedule(assignments, availability, WEEK_START, new Date(0), "evening");
    expect(result.blocks).toHaveLength(2);
    // Should still use Monday first (day order preserved), even though preference is evening
    expect(result.blocks[0].start.getDay()).toBe(1); // Monday
  });

  it("preference none behaves like no preference", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 60 }),
    ];
    const availability: Availability = [
      block("monday", "09:00", "10:00"),
      block("monday", "18:00", "19:00"),
    ];
    const withNone = generateSchedule(assignments, availability, WEEK_START, new Date(0), "none");
    const withoutPref = generateSchedule(assignments, availability, WEEK_START, new Date(0));
    expect(withNone.blocks.map((b) => b.start.getTime())).toEqual(
      withoutPref.blocks.map((b) => b.start.getTime())
    );
  });
});
