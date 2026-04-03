import dayjs from "dayjs";
import { Assignment, AvailabilityGrid, ScheduleBlock } from "./types";

const DAYS = [
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
 * slots until estimated time is covered. Won't schedule past due date.
 * Returns schedule blocks + list of at-risk assignment IDs.
 */
export function generateSchedule(
  assignments: Assignment[],
  availability: AvailabilityGrid,
  weekStart: Date
): { blocks: ScheduleBlock[]; atRisk: string[] } {
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const blocks: ScheduleBlock[] = [];
  const atRisk: string[] = [];

  // Build list of available 1-hour slots for the week, sorted chronologically
  const slots: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];
  for (let d = 0; d < 7; d++) {
    const day = dayjs(weekStart).add(d, "day");
    const dayName = DAYS[day.day()];
    for (let h = 7; h < 23; h++) {
      const key = `${dayName}-${h}`;
      if (availability[key]) {
        slots.push({
          start: day.hour(h).minute(0).second(0),
          end: day.hour(h + 1).minute(0).second(0),
        });
      }
    }
  }

  const usedSlots = new Set<number>();

  for (const assignment of sorted) {
    let remainingMinutes = assignment.estimatedMinutes;
    const dueDate = dayjs(assignment.dueDate).endOf("day");

    for (let i = 0; i < slots.length && remainingMinutes > 0; i++) {
      if (usedSlots.has(i)) continue;
      if (slots[i].start.isAfter(dueDate)) break;

      usedSlots.add(i);
      remainingMinutes -= 60;

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
