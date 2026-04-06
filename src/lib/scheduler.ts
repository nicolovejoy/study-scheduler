import dayjs from "dayjs";
import {
  Assignment,
  Availability,
  DAYS_FROM_SUNDAY,
  ScheduleBlock,
  StudyTimePreference,
  STUDY_TIME_RANGES,
} from "./types";
import { parseTime } from "./time";

/**
 * Greedy scheduler: sorts assignments by due date, fills earliest available
 * 30-minute slots until estimated time is covered. Won't schedule past due date.
 * Returns schedule blocks + list of at-risk assignment IDs.
 */
export function generateSchedule(
  assignments: Assignment[],
  availability: Availability,
  weekStart: Date,
  now: Date = new Date(),
  preference: StudyTimePreference = "none"
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
    const dayName = DAYS_FROM_SUNDAY[day.day()];
    const dayBlocks = availability.filter((b) => b.day === dayName);

    for (const block of dayBlocks) {
      const [startH, startM] = parseTime(block.start);
      const [endH, endM] = parseTime(block.end);
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

  // If user has a time-of-day preference, sort preferred-hour slots first
  // within each day while preserving day order
  if (preference !== "none") {
    const range = STUDY_TIME_RANGES[preference];
    slots.sort((a, b) => {
      // Keep day order stable
      const dayDiff = a.start.startOf("day").valueOf() - b.start.startOf("day").valueOf();
      if (dayDiff !== 0) return dayDiff;
      // Within same day, preferred hours come first
      const aInRange = a.start.hour() >= range.startHour && a.start.hour() < range.endHour;
      const bInRange = b.start.hour() >= range.startHour && b.start.hour() < range.endHour;
      if (aInRange && !bInRange) return -1;
      if (!aInRange && bInRange) return 1;
      // Both in or both out — keep chronological
      return a.start.valueOf() - b.start.valueOf();
    });
  }

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
