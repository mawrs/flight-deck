import type { EmailActivity } from "./activity";

const KEY = "fd-email-log-v1";
const EMPTY: EmailActivity[] = [];
const listeners = new Set<() => void>();
let snapshot: EmailActivity[] = EMPTY;
let hydrated = false;

function readStored(): EmailActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as EmailActivity[]) : [];
  } catch {
    return [];
  }
}

export function subscribeEmailLog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEmailLogSnapshot() {
  if (!hydrated) {
    snapshot = readStored();
    hydrated = true;
  }
  return snapshot;
}

export function getEmailLogServerSnapshot() {
  return EMPTY;
}

export function logEmail(entry: EmailActivity) {
  const next = [entry, ...readStored().filter((item) => item.id !== entry.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
  snapshot = next;
  hydrated = true;
  listeners.forEach((listener) => listener());
  return next;
}

export function sentStamp(date = new Date()) {
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timePart = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" AM", "am").replace(" PM", "pm");
  return `${datePart} ${timePart}`;
}
