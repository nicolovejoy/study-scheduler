"use client";

import dayjs from "dayjs";

interface DatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (date: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const today = dayjs();
  const startOfWeek = today.startOf("week"); // Sunday
  const days: dayjs.Dayjs[] = [];

  // Show this week + next week (14 days starting from Sunday)
  for (let i = 0; i < 14; i++) {
    days.push(startOfWeek.add(i, "day"));
  }

  const weeks = [days.slice(0, 7), days.slice(7, 14)];
  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1">
        {weekLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-xs font-medium text-zinc-400"
          >
            {label}
          </div>
        ))}
        {weeks.map((week) =>
          week.map((day) => {
            const dateStr = day.format("YYYY-MM-DD");
            const isSelected = value === dateStr;
            const isPast = day.isBefore(today, "day");
            const isToday = day.isSame(today, "day");

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast}
                onClick={() => onChange(dateStr)}
                className={`flex h-10 items-center justify-center rounded-md text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-500 font-semibold text-white"
                    : isPast
                      ? "cursor-not-allowed text-zinc-300 dark:text-zinc-700"
                      : isToday
                        ? "border border-blue-300 font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="text-xs text-zinc-400">
                  {day.format("MMM")}&nbsp;
                </span>
                {day.date()}
              </button>
            );
          })
        )}
      </div>
      {value && (
        <p className="text-sm text-zinc-500">
          Due: {dayjs(value).format("dddd, MMMM D")}
        </p>
      )}
    </div>
  );
}
