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

export type Day =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface AvailabilityBlock {
  id: string;
  day: Day;
  start: string; // "09:00" — 24h HH:MM
  end: string;   // "11:30" — 24h HH:MM
}

export type Availability = AvailabilityBlock[];
