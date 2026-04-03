"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAssignment } from "@/lib/storage";
import DatePicker from "@/components/DatePicker";

export default function AddAssignment() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) throw new Error("Estimation failed");

      const { estimatedMinutes, reasoning } = await res.json();

      addAssignment({
        id: crypto.randomUUID(),
        title,
        description,
        dueDate,
        estimatedMinutes,
        reasoning,
        createdAt: new Date().toISOString(),
      });

      router.push("/");
    } catch {
      setError("Failed to estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add Assignment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ochem Problem Set 5"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Assignment Description
          </label>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the assignment description here..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Due Date</label>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Estimating..." : "Get Estimate & Save"}
        </button>
      </form>
    </div>
  );
}
