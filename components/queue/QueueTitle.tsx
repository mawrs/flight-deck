"use client";

import { useEffect, useRef, useState } from "react";
import { useViewLabels } from "@/lib/view-labels";
import type { QueueViewId } from "@/lib/queues";

export function QueueTitle({ viewId }: { viewId: QueueViewId }) {
  const { labelFor, renameView } = useViewLabels();
  const label = labelFor(viewId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const input = useRef<HTMLInputElement>(null);
  const skipSave = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [editing, label]);

  useEffect(() => {
    if (!editing) return;
    input.current?.focus();
    input.current?.select();
  }, [editing]);

  function save() {
    const next = input.current?.value ?? draft;
    setEditing(false);
    renameView(viewId, next);
  }

  if (editing) {
    return (
      <form
        className="flex min-w-0 items-center gap-sm"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          ref={input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (skipSave.current) {
              skipSave.current = false;
              return;
            }
            save();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              skipSave.current = true;
              setDraft(label);
              setEditing(false);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
          aria-label="Queue name"
          className="min-w-0 flex-1 rounded-xs border border-primary bg-white px-sm py-[2px] text-xl font-semibold text-black outline-none"
        />
      </form>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-sm">
      <h1 className="text-xl font-semibold text-black">{label}</h1>
      <button
        type="button"
        aria-label="Rename queue"
        onClick={() => setEditing(true)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-gray-medium hover:bg-gray-lightest hover:text-primary"
      >
        <PencilIcon />
      </button>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.2 2.8l2 2-8.4 8.4H2.8v-2L11.2 2.8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10 4l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
