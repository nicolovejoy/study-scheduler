"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth";
import { useAssignments, mutateDeleteAssignment, mutateUpdateAssignment } from "@/lib/hooks";

export default function Dashboard() {
  const { user } = useAuth();
  const { assignments: raw, error: loadError } = useAssignments(user?.uid);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actualHours, setActualHours] = useState("");

  const assignments = useMemo(
    () =>
      [...raw].sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [raw]
  );

  const pending = assignments.filter((a) => !a.completedAt);
  const completed = assignments.filter((a) => a.completedAt);

  async function handleDelete(id: string) {
    if (!user) return;
    if (!window.confirm("Delete this assignment? This cannot be undone.")) return;
    try {
      await mutateDeleteAssignment(user.uid, id);
    } catch {
      setError("Could not delete assignment. Please try again.");
    }
  }

  function handleStartComplete(id: string) {
    setCompletingId(id);
    setActualHours("");
  }

  async function handleSubmitActual(id: string) {
    if (!user) return;
    const minutes = Math.round(parseFloat(actualHours) * 60);
    if (isNaN(minutes) || minutes <= 0) return;
    try {
      await mutateUpdateAssignment(user.uid, id, {
        actualMinutes: minutes,
        completedAt: new Date().toISOString(),
      });
    } catch {
      setError("Could not save. Please try again.");
    }
    setCompletingId(null);
  }

  const fmtMinutes = (mins: number) =>
    mins < 60 ? `${Math.round(mins)}m` : `${Math.round((mins / 60) * 10) / 10}h`;

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
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold">{a.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Due {dayjs(a.dueDate).format("ddd, MMM D")} &middot;{" "}
                        {fmtMinutes(a.estimatedMinutes)} estimated
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">{a.reasoning}</p>
                    </div>
                    <div className="ml-4 flex gap-3">
                      {completingId !== a.id && (
                        <button
                          onClick={() => handleStartComplete(a.id)}
                          className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {completingId === a.id && (
                    <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <label className="text-sm text-zinc-600 dark:text-zinc-400">
                        How long did it actually take?
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.25"
                        placeholder="hours"
                        value={actualHours}
                        onChange={(e) => setActualHours(e.target.value)}
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <span className="text-sm text-zinc-500">hrs</span>
                      <button
                        onClick={() => handleSubmitActual(a.id)}
                        disabled={!actualHours || parseFloat(actualHours) <= 0}
                        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setCompletingId(null)}
                        className="text-sm text-zinc-400 hover:text-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Completed
              </h2>
              <div className="space-y-3">
                {completed.map((a) => {
                  const diffMins = Math.round((a.actualMinutes ?? 0) - a.estimatedMinutes);
                  const diffLabel =
                    diffMins === 0
                      ? "exactly as estimated"
                      : diffMins > 0
                      ? `${fmtMinutes(diffMins)} over estimate`
                      : `${fmtMinutes(Math.abs(diffMins))} under estimate`;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start justify-between rounded-lg border border-zinc-100 p-4 opacity-60 dark:border-zinc-800"
                    >
                      <div>
                        <h2 className="font-semibold line-through">{a.title}</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {fmtMinutes(a.estimatedMinutes)} estimated &middot;{" "}
                          {fmtMinutes(a.actualMinutes ?? 0)} actual &middot;{" "}
                          <span
                            className={
                              diffMins > 0
                                ? "text-red-500"
                                : diffMins < 0
                                ? "text-green-600"
                                : "text-zinc-500"
                            }
                          >
                            {diffLabel}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="ml-4 text-sm text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
