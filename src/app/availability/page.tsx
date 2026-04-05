"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Availability, AvailabilityBlock, Day } from "@/lib/types";
import { DAYS_FROM_MONDAY, DAY_LABELS } from "@/lib/types";
import { getAvailability, saveAvailability } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import { formatTime, toMinutes, sortAvailabilityBlocks } from "@/lib/time";

const emptyPerDay = () =>
  Object.fromEntries(DAYS_FROM_MONDAY.map((d) => [d, ""])) as Record<Day, string>;

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Availability>([]);
  const [newStart, setNewStart] = useState<Record<Day, string>>(emptyPerDay());
  const [newEnd, setNewEnd] = useState<Record<Day, string>>(emptyPerDay());
  const [addErrors, setAddErrors] = useState<Record<Day, string>>(emptyPerDay());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [loadError, setLoadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBlocks(await getAvailability(user.uid));
    } catch {
      setLoadError("Could not load availability. Please try refreshing.");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function persistBlocks(updated: Availability) {
    if (!user) return;
    setBlocks(updated);
    try {
      await saveAvailability(user.uid, updated);
    } catch {
      setLoadError("Could not save changes. Please try again.");
    }
  }

  function addBlock(day: Day) {
    const start = newStart[day];
    const end = newEnd[day];

    if (!start || !end) {
      setAddErrors((prev) => ({ ...prev, [day]: "Enter both start and end times." }));
      return;
    }
    if (toMinutes(start) >= toMinutes(end)) {
      setAddErrors((prev) => ({ ...prev, [day]: "End time must be after start time." }));
      return;
    }
    if (toMinutes(end) - toMinutes(start) < 30) {
      setAddErrors((prev) => ({ ...prev, [day]: "Block must be at least 30 minutes." }));
      return;
    }

    const newBlock: AvailabilityBlock = {
      id: crypto.randomUUID(),
      day,
      start,
      end,
    };
    const updated = sortAvailabilityBlocks([...blocks, newBlock], DAYS_FROM_MONDAY);

    persistBlocks(updated);
    setNewStart((prev) => ({ ...prev, [day]: "" }));
    setNewEnd((prev) => ({ ...prev, [day]: "" }));
    setAddErrors((prev) => ({ ...prev, [day]: "" }));
  }

  function deleteBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    persistBlocks(updated);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/parse-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData: base64, fileMimeType: file.type }),
        });
        if (!res.ok) throw new Error();
        const { blocks: imported } = await res.json();
        const withIds: Availability = (
          imported as Omit<AvailabilityBlock, "id">[]
        ).map((b) => ({ ...b, id: crypto.randomUUID() }));
        const merged = sortAvailabilityBlocks([...blocks, ...withIds], DAYS_FROM_MONDAY);
        await persistBlocks(merged);
      } catch {
        setImportError("Could not parse schedule. Please try again.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setImportError("Could not read file.");
      setImporting(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Availability</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add the time windows when you&apos;re free to study each week.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImport}
            className="hidden"
            id="schedule-import"
          />
          <label
            htmlFor="schedule-import"
            className={`cursor-pointer whitespace-nowrap rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 ${
              importing ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {importing ? "Importing\u2026" : "Import from Google Calendar"}
          </label>
          {importError && (
            <p className="text-xs text-red-500">{importError}</p>
          )}
        </div>
      </div>

      {loadError && (
        <p className="mb-4 text-sm text-red-500">{loadError}</p>
      )}

      <div className="space-y-6">
        {DAYS_FROM_MONDAY.map((day) => {
          const dayBlocks = blocks.filter((b) => b.day === day);
          return (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {DAY_LABELS[day]}
              </h2>

              {dayBlocks.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {dayBlocks.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-950"
                    >
                      <span className="text-blue-800 dark:text-blue-200">
                        {formatTime(b.start)} – {formatTime(b.end)}
                      </span>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="ml-4 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                        aria-label="Remove block"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newStart[day]}
                  onChange={(e) =>
                    setNewStart((prev) => ({ ...prev, [day]: e.target.value }))
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <span className="text-zinc-400">–</span>
                <input
                  type="time"
                  value={newEnd[day]}
                  onChange={(e) =>
                    setNewEnd((prev) => ({ ...prev, [day]: e.target.value }))
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  onClick={() => addBlock(day)}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Add
                </button>
              </div>
              {addErrors[day] && (
                <p className="mt-1 text-xs text-red-500">{addErrors[day]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
