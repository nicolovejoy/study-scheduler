export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  estimatedMinutes: number;
  reasoning: string;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  assignmentId: string;
  title: string;
  start: Date;
  end: Date;
  type: "study" | "busy";
}

export type AvailabilityGrid = Record<string, boolean>; // "day-hour" -> available
