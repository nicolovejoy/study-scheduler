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
});
