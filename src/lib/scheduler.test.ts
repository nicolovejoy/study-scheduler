import { describe, it, expect } from "vitest";
import { generateSchedule } from "./scheduler";
import { Assignment, AvailabilityGrid } from "./types";

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

describe("generateSchedule", () => {
  it("returns empty blocks when no assignments", () => {
    const result = generateSchedule([], {}, WEEK_START);
    expect(result.blocks).toEqual([]);
    expect(result.atRisk).toEqual([]);
  });

  it("returns empty blocks when no availability", () => {
    const assignments = [makeAssignment({ id: "1", title: "Ochem" })];
    const result = generateSchedule(assignments, {}, WEEK_START);
    expect(result.blocks).toEqual([]);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("schedules blocks into available slots", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 120 }),
    ];
    const availability: AvailabilityGrid = {
      "monday-9": true,
      "monday-10": true,
      "monday-11": true,
    };
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
    expect(result.atRisk).toEqual([]);
    expect(result.blocks[0].title).toBe("Ochem");
  });

  it("flags at-risk when not enough slots", () => {
    const assignments = [
      makeAssignment({ id: "1", title: "Ochem", estimatedMinutes: 180 }),
    ];
    const availability: AvailabilityGrid = {
      "monday-9": true,
      "monday-10": true,
    };
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
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
    const availability: AvailabilityGrid = {
      "monday-9": true,
      "monday-10": true,
    };
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks[0].title).toBe("Ochem");
    expect(result.blocks[1].title).toBe("Bio");
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
    const availability: AvailabilityGrid = {
      "monday-9": true,
      "monday-10": true,
      "tuesday-9": true, // past due date
    };
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
    expect(result.atRisk).toEqual(["1"]);
  });

  it("does not double-book slots across assignments", () => {
    const assignments = [
      makeAssignment({
        id: "1",
        title: "Ochem",
        estimatedMinutes: 60,
      }),
      makeAssignment({
        id: "2",
        title: "Bio",
        estimatedMinutes: 60,
      }),
    ];
    const availability: AvailabilityGrid = {
      "monday-9": true,
      "monday-10": true,
    };
    const result = generateSchedule(assignments, availability, WEEK_START);
    expect(result.blocks).toHaveLength(2);
    // Each assignment gets a different slot
    const starts = result.blocks.map((b) => b.start.getTime());
    expect(new Set(starts).size).toBe(2);
  });
});
