import { describe, it, expect } from "vitest";
import { parseTime, formatTime, toMinutes, sortAvailabilityBlocks } from "./time";
import type { AvailabilityBlock, Day } from "./types";
import { DAYS_FROM_MONDAY } from "./types";

describe("parseTime", () => {
  it("parses HH:MM into [hours, minutes]", () => {
    expect(parseTime("09:30")).toEqual([9, 30]);
    expect(parseTime("14:00")).toEqual([14, 0]);
    expect(parseTime("00:00")).toEqual([0, 0]);
    expect(parseTime("23:59")).toEqual([23, 59]);
  });
});

describe("formatTime", () => {
  it("formats 24h time to 12h with suffix", () => {
    expect(formatTime("09:00")).toBe("9:00am");
    expect(formatTime("09:30")).toBe("9:30am");
    expect(formatTime("12:00")).toBe("12:00pm");
    expect(formatTime("13:00")).toBe("1:00pm");
    expect(formatTime("00:00")).toBe("12:00am");
    expect(formatTime("23:45")).toBe("11:45pm");
  });
});

describe("toMinutes", () => {
  it("converts HH:MM to total minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("01:30")).toBe(90);
    expect(toMinutes("09:00")).toBe(540);
    expect(toMinutes("14:15")).toBe(855);
    expect(toMinutes("23:59")).toBe(1439);
  });
});

describe("sortAvailabilityBlocks", () => {
  function block(day: Day, start: string, end: string): AvailabilityBlock {
    return { id: `${day}-${start}`, day, start, end };
  }

  it("sorts by day order then by start time", () => {
    const blocks = [
      block("wednesday", "09:00", "10:00"),
      block("monday", "14:00", "15:00"),
      block("monday", "09:00", "10:00"),
    ];
    const sorted = sortAvailabilityBlocks(blocks, DAYS_FROM_MONDAY);
    expect(sorted.map((b) => `${b.day}-${b.start}`)).toEqual([
      "monday-09:00",
      "monday-14:00",
      "wednesday-09:00",
    ]);
  });

  it("does not mutate the original array", () => {
    const blocks = [
      block("tuesday", "09:00", "10:00"),
      block("monday", "09:00", "10:00"),
    ];
    const original = [...blocks];
    sortAvailabilityBlocks(blocks, DAYS_FROM_MONDAY);
    expect(blocks).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortAvailabilityBlocks([], DAYS_FROM_MONDAY)).toEqual([]);
  });
});
