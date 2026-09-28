"use client";

import { useCallback, useSyncExternalStore } from "react";
import { QUEUE_VIEWS, type QueueViewId } from "./queues";

const KEY = "uw-prototype-view-labels";

type Labels = Partial<Record<QueueViewId, string>>;

const EMPTY: Labels = {};
const listeners = new Set<() => void>();
let labels: Labels = EMPTY;
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function load(): Labels {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Labels;
    return parsed && typeof parsed === "object" ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(next: Labels) {
  labels = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!hydrated) {
    labels = load();
    hydrated = true;
  }
  return labels;
}

function getServerSnapshot(): Labels {
  return EMPTY;
}

export function defaultViewLabel(id: QueueViewId) {
  return QUEUE_VIEWS.find((view) => view.id === id)?.label ?? QUEUE_VIEWS[0].label;
}

export function useViewLabels() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const labelFor = useCallback(
    (id: QueueViewId) => {
      const custom = stored[id]?.trim();
      return custom || defaultViewLabel(id);
    },
    [stored],
  );

  const renameView = useCallback((id: QueueViewId, next: string) => {
    const trimmed = next.trim();
    persist({
      ...getSnapshot(),
      [id]: trimmed || defaultViewLabel(id),
    });
  }, []);

  return { labelFor, renameView };
}
