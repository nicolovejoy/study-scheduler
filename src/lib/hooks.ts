"use client";

import useSWR, { mutate } from "swr";
import {
  getAssignments,
  getAvailability,
  getStudyTimePreference,
  addAssignment,
  deleteAssignment,
  saveAvailability,
  saveStudyTimePreference,
} from "./storage";
import type { Assignment, Availability, StudyTimePreference } from "./types";

// --- Assignments ---

export function useAssignments(uid: string | undefined) {
  const { data, error, isLoading } = useSWR(
    uid ? `assignments/${uid}` : null,
    () => getAssignments(uid!)
  );
  return {
    assignments: data ?? [],
    error: error ? "Could not load assignments." : "",
    isLoading,
  };
}

export async function mutateAddAssignment(uid: string, assignment: Assignment) {
  await addAssignment(uid, assignment);
  await mutate(`assignments/${uid}`);
}

export async function mutateDeleteAssignment(uid: string, id: string) {
  // Optimistic update: remove from cache immediately
  await mutate(
    `assignments/${uid}`,
    (current: Assignment[] | undefined) =>
      current?.filter((a) => a.id !== id) ?? [],
    { revalidate: false }
  );
  await deleteAssignment(uid, id);
}

// --- Availability ---

export function useAvailability(uid: string | undefined) {
  const { data, error, isLoading } = useSWR(
    uid ? `availability/${uid}` : null,
    () => getAvailability(uid!)
  );
  return {
    availability: data ?? [],
    error: error ? "Could not load availability." : "",
    isLoading,
  };
}

export async function mutateSaveAvailability(uid: string, blocks: Availability) {
  await mutate(`availability/${uid}`, blocks, { revalidate: false });
  await saveAvailability(uid, blocks);
}

// --- Study Time Preference ---

export function useStudyTimePreference(uid: string | undefined) {
  const { data, error, isLoading } = useSWR(
    uid ? `preference/${uid}` : null,
    () => getStudyTimePreference(uid!)
  );
  return {
    preference: data ?? "none" as StudyTimePreference,
    error: error ? "Could not load preference." : "",
    isLoading,
  };
}

export async function mutateSavePreference(uid: string, pref: StudyTimePreference) {
  await mutate(`preference/${uid}`, pref, { revalidate: false });
  await saveStudyTimePreference(uid, pref);
}
