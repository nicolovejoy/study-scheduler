"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addAssignment } from "@/lib/storage";
import DatePicker from "@/components/DatePicker";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

export default function AddAssignment() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  function clearFile() {
    setFileData(null);
    setFileName(null);
    setFileMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Unsupported file type. Please upload a PDF, image, or .txt file.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large (max 20MB).");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    if (file.type === "text/plain") {
      reader.onload = () => {
        const text = reader.result as string;
        setDescription((prev) => (prev.trim() ? prev + "\n\n" + text : text));
        clearFile();
      };
      reader.onerror = () => setError("Could not read file.");
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setFileData(base64);
        setFileName(file.name);
        setFileMimeType(file.type);
      };
      reader.onerror = () => setError("Could not read file.");
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() && !fileData) {
      setError("Please add a description or upload a file.");
      return;
    }

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
        body: JSON.stringify({ description, fileData, fileName, fileMimeType }),
      });

      if (!res.ok) throw new Error("Estimation failed");

      const { estimatedMinutes, reasoning } = await res.json();

      addAssignment({
        id: crypto.randomUUID(),
        title,
        description: description.trim() || fileName || "Uploaded file",
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
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the assignment description here..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Upload File{" "}
            <span className="font-normal text-zinc-500">(PDF, image, or .txt)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp,image/gif,text/plain"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700"
          />
          {fileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="rounded-full bg-zinc-100 px-3 py-0.5 dark:bg-zinc-800">
                {fileName}
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          )}
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
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Estimating...
            </span>
          ) : (
            "Get Estimate & Save"
          )}
        </button>
      </form>
    </div>
  );
}
