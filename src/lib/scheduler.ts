import dayjs from "dayjs";
import { Assignment, Availability, Day, ScheduleBlock } from "./types";

const DAYS: Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Greedy scheduler: sorts assignments by due date, fills earliest available
 * 30-minute slots until estimated time is covered. Won't schedule past due date.
 * Returns schedule blocks + list of at-risk assignment IDs.
 */
export function generateSchedule(
  assignments: Assignment[],
  availability: Availability,
  weekStart: Date,
  now: Date = new Date()
): { blocks: ScheduleBlock[]; atRisk: string[] } {
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const blocks: ScheduleBlock[] = [];
  const atRisk: string[] = [];

  // Build list of available 30-minute slots for the week, sorted chronologically
  const slots: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];
  const nowDayjs = dayjs(now);

  for (let d = 0; d < 7; d++) {
    const day = dayjs(weekStart).add(d, "day");
    const dayName = DAYS[day.day()];
    const dayBlocks = availability.filter((b) => b.day === dayName);

    for (const block of dayBlocks) {
      const [startH, startM] = block.start.split(":").map(Number);
      const [endH, endM] = block.end.split(":").map(Number);
      let cursor = day.hour(startH).minute(startM).second(0);
      const blockEnd = day.hour(endH).minute(endM).second(0);

      while (
        cursor.add(30, "minute").isBefore(blockEnd) ||
        cursor.add(30, "minute").isSame(blockEnd)
      ) {
        // Skip slots that have already passed
        if (cursor.isAfter(nowDayjs) || cursor.isSame(nowDayjs)) {
          slots.push({ start: cursor, end: cursor.add(30, "minute") });
        }
        cursor = cursor.add(30, "minute");
      }
    }
  }

  // Sort slots chronologically (blocks within a day are already ordered,
  // but multiple days need merging in order)
  slots.sort((a, b) => a.start.valueOf() - b.start.valueOf());

  const usedSlots = new Set<number>();

  for (const assignment of sorted) {
    let remainingMinutes = assignment.estimatedMinutes;
    const dueDate = dayjs(assignment.dueDate).endOf("day");

    for (let i = 0; i < slots.length && remainingMinutes > 0; i++) {
      if (usedSlots.has(i)) continue;
      if (slots[i].start.isAfter(dueDate)) break;

      usedSlots.add(i);
      remainingMinutes -= 30;

      blocks.push({
        id: `${assignment.id}-${i}`,
        assignmentId: assignment.id,
        title: assignment.title,
        start: slots[i].start.toDate(),
        end: slots[i].end.toDate(),
        type: "study",
      });
    }

    if (remainingMinutes > 0) {
      atRisk.push(assignment.id);
    }
  }

  return { blocks, atRisk };
}
