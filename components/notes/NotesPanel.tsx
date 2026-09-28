"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { Button } from "@/components/Button";
import type { Application, Notes } from "@/lib/types";

const fields: { key: keyof Notes; label: string; hint: string }[] = [
  { key: "income", label: "Income", hint: "Documented pay, frequency, and stability" },
  { key: "documentation", label: "Housing", hint: "Stated housing and payment on the application" },
  { key: "creditScore", label: "CR", hint: "Name, DOB, and credit-report match" },
  { key: "fico", label: "FICO", hint: "FICO used vs. exceptions" },
  { key: "degree", label: "DEGREE", hint: "School, credential, and verification" },
  { key: "payoff", label: "Payoff", hint: "Sallie Mae and other payoff cross-check" },
  { key: "general", label: "GRAD DEGREE", hint: "Graduate credential or other rationale" },
];

const emptyNotes = (): Notes => ({
  income: "",
  creditScore: "",
  degree: "",
  fico: "",
  documentation: "",
  payoff: "",
  general: "",
});

function hasNoteContent(notes: Notes) {
  return Object.values(notes).some((value) => value.trim());
}

export function NotesPanel({
  application,
  onChange,
  readOnly = false,
}: {
  application: Application;
  onChange: (notes: Notes) => void;
  readOnly?: boolean;
}) {
  const exists = hasNoteContent(application.notes);
  const [open, setOpen] = useState(exists);
  const [editing, setEditing] = useState(false);
  const firstField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (hasNoteContent(application.notes)) setOpen(true);
  }, [application.notes]);

  const visible = open || exists;
  const count = exists || open ? 1 : 0;
  const canWrite = !readOnly;

  function startEdit() {
    setOpen(true);
    setEditing(true);
    requestAnimationFrame(() => firstField.current?.focus());
  }

  function createNote() {
    if (!visible) setOpen(true);
    startEdit();
  }

  function deleteNote() {
    setEditing(false);
    setOpen(false);
    onChange(emptyNotes());
  }

  return (
    <div className="overflow-hidden rounded-sm border border-gray-light">
      <div className="flex items-center justify-between gap-md bg-gray-lightest px-md py-[12px]">
        <div className="flex items-center gap-sm">
          <span
            aria-hidden
            className="inline-flex size-7 items-center justify-center rounded-xs bg-gray-dark text-white"
          >
            <WrenchIcon />
          </span>
          <h2 className="text-sm font-semibold text-charcoal">Internal Notes ({count})</h2>
        </div>
        {canWrite ? (
          <div className="flex items-center gap-sm">
            {visible ? (
              <>
                <Button variant="outline" size="small" onClick={editing ? () => setEditing(false) : startEdit}>
                  <PencilIcon />
                  {editing ? "Done" : "Edit"}
                </Button>
                <Button variant="danger" size="small" onClick={deleteNote}>
                  Delete
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="small" onClick={createNote}>
              New
            </Button>
          </div>
        ) : null}
      </div>
      {visible ? (
        <div className="space-y-md bg-white p-md">
          {fields.map((field, index) => (
            <NoteField
              key={field.key}
              field={field}
              value={application.notes[field.key]}
              editing={editing}
              readOnly={!canWrite}
              inputRef={index === 0 ? firstField : undefined}
              onChange={(value) =>
                onChange({ ...application.notes, [field.key]: value })
              }
              onEdit={startEdit}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NoteField({
  field,
  value,
  editing,
  readOnly,
  inputRef,
  onChange,
  onEdit,
}: {
  field: { key: keyof Notes; label: string; hint: string };
  value: string;
  editing: boolean;
  readOnly: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onEdit: () => void;
}) {
  return (
    <div className="group block">
      <div className="text-sm font-semibold text-charcoal">{field.label}:</div>
      <div className="text-xs text-gray-medium">{field.hint}</div>
      {editing && !readOnly ? (
        <textarea
          ref={inputRef}
          className="uw-input mt-xs w-full"
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="mt-xs flex items-start gap-xs">
          <p className="min-h-5 flex-1 whitespace-pre-wrap text-sm">{value || "—"}</p>
          {readOnly ? null : (
            <button
              type="button"
              aria-label={`Edit ${field.label}`}
              onClick={onEdit}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-gray-medium opacity-0 group-hover:opacity-100 hover:bg-gray-lightest hover:text-primary focus-visible:opacity-100"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.6 2.4a2.8 2.8 0 0 0-3.7 3.2L3.2 10.3a1.4 1.4 0 0 0 2.5 1.1l4.6-4.7a2.8 2.8 0 0 0 1.3-4.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10.2 3.8l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
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
