import type { AvailabilityBlock, Day } from "./types";

export function parseTime(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h, m];
}

export function formatTime(t: string): string {
  const [h, m] = parseTime(t);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")}${suffix}`;
}

export function toMinutes(t: string): number {
  const [h, m] = parseTime(t);
  return h * 60 + m;
}

export function sortAvailabilityBlocks(
  blocks: AvailabilityBlock[],
  dayOrder: Day[]
): AvailabilityBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.day !== b.day) return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    return toMinutes(a.start) - toMinutes(b.start);
  });
}
