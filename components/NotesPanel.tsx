"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Divider } from "./Divider";
import styles from "./NotesPanel.module.css";

export type PanelNote = {
  author: string;
  at: string;
  body: string;
};

type NotesPanelProps = {
  requestType: string;
  created: string;
  customer: string;
  notes: PanelNote[];
  onClose: () => void;
  onAdd: (body: string) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NotesPanel({ requestType, created, customer, notes, onClose, onAdd }: NotesPanelProps) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onAdd(body);
    setDraft("");
  }

  return (
    <aside className={styles.panel} aria-label="Notes">
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.title}>
            <h2>Notes</h2>
            <span className={styles.count}>{notes.length}</span>
          </div>
          <button className={styles.close} type="button" aria-label="Close notes" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Account Request Type</span>
            <div className={styles.summaryValue}>
              <strong>{requestType}</strong>
              <span>Created on: {created}</span>
            </div>
          </div>
          <div className={styles.summaryRow}>
            <span>Customer Name</span>
            <strong>{customer}</strong>
          </div>
        </div>
        <div className={styles.thread}>
          {notes.map((note, index) => (
            <div key={`${note.at}-${index}`} className={styles.entry}>
              {index > 0 ? <Divider /> : null}
              <article className={styles.note}>
                <div className={styles.author}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(note.author)}
                  </span>
                  <span>
                    <strong>{note.author}</strong>
                    <span className={styles.time}>{note.at}</span>
                  </span>
                </div>
                <p>{note.body}</p>
              </article>
            </div>
          ))}
        </div>
      </div>
      <form className={styles.composer} onSubmit={submit}>
        <textarea
          value={draft}
          placeholder="Type note here..."
          aria-label="Type note here"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" size="small" disabled={!draft.trim()}>
          Add Note
        </Button>
      </form>
    </aside>
  );
}
