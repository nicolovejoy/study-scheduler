import { Assignment, Availability } from "./types";

const ASSIGNMENTS_KEY = "study-scheduler-assignments";
const AVAILABILITY_KEY = "study-scheduler-availability";

export function getAssignments(): Assignment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ASSIGNMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAssignments(assignments: Assignment[]) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function addAssignment(assignment: Assignment) {
  const assignments = getAssignments();
  assignments.push(assignment);
  saveAssignments(assignments);
}

export function deleteAssignment(id: string) {
  const assignments = getAssignments().filter((a) => a.id !== id);
  saveAssignments(assignments);
}

export function getAvailability(): Availability {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AVAILABILITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Guard against old grid format (object, not array)
    if (!Array.isArray(parsed)) return [];
    return parsed as Availability;
  } catch {
    return [];
  }
}

export function saveAvailability(blocks: Availability): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(blocks));
}
