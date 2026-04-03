"use client";

import { useEffect, useState } from "react";
import { AvailabilityGrid } from "@/lib/types";
import { getAvailability, saveAvailability } from "@/lib/storage";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am-10pm

function formatHour(h: number) {
  if (h === 0 || h === 12) return `12${h === 0 ? "am" : "pm"}`;
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export default function Availability() {
  const [grid, setGrid] = useState<AvailabilityGrid>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

  useEffect(() => {
    setGrid(getAvailability());
  }, []);

  function toggle(key: string) {
    setGrid((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveAvailability(next);
      return next;
    });
  }

  function handleMouseDown(key: string) {
    setIsDragging(true);
    const newValue = !grid[key];
    setDragValue(newValue);
    setGrid((prev) => {
      const next = { ...prev, [key]: newValue };
      saveAvailability(next);
      return next;
    });
  }

  function handleMouseEnter(key: string) {
    if (!isDragging) return;
    setGrid((prev) => {
      const next = { ...prev, [key]: dragValue };
      saveAvailability(next);
      return next;
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Weekly Availability</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Click or drag to mark when you&apos;re free to study.
      </p>
      <div
        className="select-none overflow-x-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
          }}
        >
          {/* Header */}
          <div />
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-zinc-500"
            >
              {d}
            </div>
          ))}
          {/* Grid */}
          {HOURS.map((h) => (
            <>
              <div
                key={`label-${h}`}
                className="flex items-center justify-end pr-2 text-xs text-zinc-400"
              >
                {formatHour(h)}
              </div>
              {DAYS.map((day) => {
                const key = `${day}-${h}`;
                return (
                  <div
                    key={key}
                    onMouseDown={() => handleMouseDown(key)}
                    onMouseEnter={() => handleMouseEnter(key)}
                    onClick={() => {
                      if (!isDragging) toggle(key);
                    }}
                    className={`h-8 cursor-pointer rounded-sm border transition-colors ${
                      grid[key]
                        ? "border-blue-400 bg-blue-500"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
