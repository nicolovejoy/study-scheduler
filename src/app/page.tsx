"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth";
import { useAssignments, mutateDeleteAssignment } from "@/lib/hooks";

export default function Dashboard() {
  const { user } = useAuth();
  const { assignments: raw, error: loadError } = useAssignments(user?.uid);
  const [error, setError] = useState("");

  const assignments = useMemo(
    () =>
      [...raw].sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [raw]
  );

  async function handleDelete(id: string) {
    if (!user) return;
    if (!window.confirm("Delete this assignment? This cannot be undone.")) return;
    try {
      await mutateDeleteAssignment(user.uid, id);
    } catch {
      setError("Could not delete assignment. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <strong className="text-zinc-900 dark:text-zinc-100">Study Scheduler</strong> helps
        you estimate how long assignments will take and auto-schedules study blocks into your
        week. Time estimates are powered by Anthropic&apos;s Claude. Your data is saved to your
        account and syncs across devices.
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Link
            href="/add"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Add Assignment
          </Link>
          <Link
            href="/schedule"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Schedule My Week
          </Link>
        </div>
      </div>

      {(error || loadError) && (
        <p className="mb-4 text-sm text-red-500">{error || loadError}</p>
      )}

      {assignments.length === 0 ? (
        <p className="text-zinc-500">
          No assignments yet.{" "}
          <Link href="/add" className="underline">
            Add one
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <h2 className="font-semibold">{a.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Due {dayjs(a.dueDate).format("ddd, MMM D")} &middot;{" "}
                  {Math.round(a.estimatedMinutes / 60 * 10) / 10}h estimated
                </p>
                <p className="mt-1 text-sm text-zinc-400">{a.reasoning}</p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="ml-4 text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
