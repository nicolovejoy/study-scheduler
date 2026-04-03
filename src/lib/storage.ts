import { Assignment, AvailabilityGrid } from "./types";

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

export function getAvailability(): AvailabilityGrid {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(AVAILABILITY_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveAvailability(grid: AvailabilityGrid) {
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(grid));
}
