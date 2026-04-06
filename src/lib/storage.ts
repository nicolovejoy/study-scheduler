import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDoc } from "firebase/firestore";
import { Assignment, Availability, AvailabilityBlock, StudyTimePreference } from "./types";

function getDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

function userCol(uid: string, col_name: string) {
  return collection(getDb(), "users", uid, col_name);
}

// --- Assignments ---

export async function getAssignments(uid: string): Promise<Assignment[]> {
  const q = query(userCol(uid, "assignments"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Assignment);
}

export async function addAssignment(uid: string, assignment: Assignment) {
  await setDoc(doc(getDb(), "users", uid, "assignments", assignment.id), assignment);
}

export async function deleteAssignment(uid: string, id: string) {
  await deleteDoc(doc(getDb(), "users", uid, "assignments", id));
}

export async function updateAssignment(uid: string, id: string, patch: Partial<Assignment>) {
  await setDoc(doc(getDb(), "users", uid, "assignments", id), patch, { merge: true });
}

// --- Preferences ---

export async function getStudyTimePreference(uid: string): Promise<StudyTimePreference> {
  const snap = await getDoc(doc(getDb(), "users", uid, "preferences", "studyTime"));
  if (!snap.exists()) return "none";
  return (snap.data().value as StudyTimePreference) ?? "none";
}

export async function saveStudyTimePreference(uid: string, pref: StudyTimePreference) {
  await setDoc(doc(getDb(), "users", uid, "preferences", "studyTime"), { value: pref });
}

// --- Availability ---

export async function getAvailability(uid: string): Promise<Availability> {
  const snap = await getDocs(userCol(uid, "availability"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AvailabilityBlock);
}

export async function saveAvailability(uid: string, blocks: Availability) {
  // Delete existing blocks, then write new ones
  const snap = await getDocs(userCol(uid, "availability"));
  await Promise.all(
    snap.docs.map((d) => deleteDoc(doc(getDb(), "users", uid, "availability", d.id)))
  );
  await Promise.all(
    blocks.map((b) => setDoc(doc(getDb(), "users", uid, "availability", b.id), b))
  );
}
