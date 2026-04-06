"use client";

import { useMemo } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import { generateSchedule } from "@/lib/scheduler";
import { useAuth } from "@/lib/auth";
import { useAssignments, useAvailability, useStudyTimePreference } from "@/lib/hooks";

const localizer = dayjsLocalizer(dayjs);

export default function SchedulePage() {
  const { user } = useAuth();
  const { assignments, error: assignErr } = useAssignments(user?.uid);
  const { availability, error: availErr } = useAvailability(user?.uid);
  const { preference } = useStudyTimePreference(user?.uid);

  const { blocks, atRisk } = useMemo(() => {
    if (assignments.length === 0 || availability.length === 0) {
      return { blocks: [], atRisk: [] as string[] };
    }
    const weekStart = dayjs().startOf("week");
    return generateSchedule(assignments, availability, weekStart.toDate(), new Date(), preference);
  }, [assignments, availability, preference]);

  const events = useMemo(
    () =>
      blocks.map((b) => ({
        title: b.title,
        start: new Date(b.start),
        end: new Date(b.end),
        resource: b,
      })),
    [blocks]
  );

  const error = assignErr || availErr;
  const atRiskAssignments = assignments.filter((a) => atRisk.includes(a.id));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Weekly Schedule</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Study blocks auto-scheduled based on your assignments and availability.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

      {atRiskAssignments.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950">
          <strong>At risk:</strong>{" "}
          {atRiskAssignments.map((a) => a.title).join(", ")} — not enough
          available time before the due date.
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-zinc-500">
          Add some assignments and set your availability first.
        </p>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          defaultView="week"
          views={["week"]}
          min={new Date(2024, 0, 1, 7, 0)}
          max={new Date(2024, 0, 1, 23, 0)}
          style={{ height: 700 }}
          eventPropGetter={(event) => ({
            className:
              event.resource.type === "study" ? "study-block" : "busy-block",
          })}
        />
      )}
    </div>
  );
}
