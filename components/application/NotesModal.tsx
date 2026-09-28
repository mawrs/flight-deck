"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { shortDate } from "@/lib/format";

const COMMANDS = [
  { cmd: "bold", title: "Bold", icon: BoldIcon },
  { cmd: "italic", title: "Italic", icon: ItalicIcon },
  { cmd: "underline", title: "Underline", icon: UnderlineIcon },
  { cmd: "insertUnorderedList", title: "Bulleted list", icon: BulletIcon },
  { cmd: "insertOrderedList", title: "Numbered list", icon: NumberIcon },
] as const;

const DEFAULT_FILE_NOTES = [
  "Income:",
  "Housing:",
  "CR:",
  "FICO:",
  "DEGREE:",
  "GRAD DEGREE:",
]
  .map((line) => `<div>${line}&nbsp;</div>`)
  .join("");

function isBlankNote(html: string) {
  return !html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NotesModal({
  open,
  value,
  updatedAt,
  onChange,
  onClose,
}: {
  open: boolean;
  value: string;
  updatedAt: string | null;
  onChange: (html: string, touch?: boolean) => void;
  onClose: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>({});

  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const blank = isBlankNote(valueRef.current);
      const html = blank ? DEFAULT_FILE_NOTES : valueRef.current;
      editor.innerHTML = html;
      if (blank) onChangeRef.current(html);
      editor.focus();
      placeCaretAfterFirstLabel(editor);
      syncActive();
    });
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function syncActive() {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }

  function run(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    emit();
    syncActive();
  }

  function emit() {
    onChange(editorRef.current?.innerHTML ?? "", true);
  }

  function onToolbarMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-xl">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/40"
        aria-label="Close notes"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="uw-dialog uw-dialog-notes"
      >
        <div className="flex items-start justify-between gap-md border-b border-gray-light px-xl py-md">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-charcoal">
              Notes
            </h2>
            <p className="text-sm text-gray-medium">
              Last updated on {updatedAt ? shortDate(updatedAt) : "—"}
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
        <div className="flex items-center gap-xs border-b border-gray-light bg-gray-lightest px-md py-sm">
          {COMMANDS.map((item) => (
            <button
              key={item.cmd}
              type="button"
              title={item.title}
              aria-label={item.title}
              aria-pressed={active[item.cmd] ?? false}
              onMouseDown={onToolbarMouseDown}
              onClick={() => run(item.cmd)}
              className={[
                "inline-flex size-8 items-center justify-center rounded-xs text-charcoal",
                active[item.cmd] ? "bg-white" : "hover:bg-white",
              ].join(" ")}
            >
              <item.icon />
            </button>
          ))}
        </div>
        <div className="px-md py-md">
          <div
            ref={editorRef}
            className="uw-editor rounded-xs border border-gray-light px-md py-md"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Notes"
            data-placeholder="Add notes for this file…"
            onInput={emit}
            onKeyUp={syncActive}
            onMouseUp={syncActive}
            onFocus={syncActive}
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function placeCaretAfterFirstLabel(editor: HTMLDivElement) {
  const first = editor.firstChild;
  if (!first) return;
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(first);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function BoldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 3h5.2a2.7 2.7 0 0 1 0 5.4H4V3Zm0 5.4h5.6A2.9 2.9 0 0 1 9.6 14H4V8.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M7 3h6M3 13h6M9.5 3 6.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 3v5.2a4 4 0 0 0 8 0V3M3.5 14h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BulletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="3.5" cy="4" r="1" fill="currentColor" />
      <circle cx="3.5" cy="8" r="1" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" />
      <path d="M6.5 4h6.5M6.5 8h6.5M6.5 12h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function NumberIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3.5h1.2v4M3 7.5h2.2M2.8 10.2c.2-.5.8-.8 1.4-.8.7 0 1.2.4 1.2 1 0 1.4-2.6 1.2-2.6 2.4h2.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 4h6.5M7.5 8h6.5M7.5 12h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
