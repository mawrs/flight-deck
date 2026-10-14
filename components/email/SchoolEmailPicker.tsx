"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import styles from "@/app/dashboard/[id]/details.module.css";

export interface CaseOption {
  id: string;
  label: string;
  school: string;
}

export function SchoolEmailPicker({
  cases,
  schools,
  onCancel,
  onNext,
}: {
  cases: CaseOption[];
  schools: string[];
  onCancel: () => void;
  onNext: (choice: { caseId: string; school: string }) => void;
}) {
  const [caseId, setCaseId] = useState("");
  const [school, setSchool] = useState("");
  const schoolOptions = schools.map((name) => ({ id: name, label: name }));

  function chooseCase(id: string) {
    setCaseId(id);
    const match = cases.find((item) => item.id === id);
    if (match?.school) setSchool(match.school);
  }

  return (
    <div className={styles.newEmail}>
      <div className={styles.newEmailHead}>New Email</div>
      <div className={styles.newEmailBody}>
        <div className={styles.newEmailStep}>
          <span className={styles.newEmailNumber}>1</span>
          <div className={styles.newEmailField}>
            <label htmlFor="cda-email-case">Student/Case Number</label>
            <ComboSearch id="cda-email-case" label="Student/Case Number" options={cases} value={caseId} onChange={chooseCase} />
          </div>
        </div>
        <div className={styles.newEmailStep}>
          <span className={styles.newEmailNumber}>2</span>
          <div className={styles.newEmailField}>
            <label htmlFor="cda-email-school">School</label>
            <ComboSearch id="cda-email-school" label="School" options={schoolOptions} value={school} onChange={setSchool} />
          </div>
        </div>
        <div className={styles.newEmailActions}>
          <Button variant="link" size="small" icon={<TrashIcon />} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="small"
            className={styles.newEmailNext}
            disabled={!caseId || !school}
            onClick={() => onNext({ caseId, school })}
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ComboSearch({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState(() => options.find((item) => item.id === value)?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedLabel = options.find((item) => item.id === value)?.label ?? "";
  const needle = query.trim().toLowerCase();
  const filtering = needle !== selectedLabel.trim().toLowerCase();
  const matches = filtering
    ? options.filter((item) => item.label.toLowerCase().includes(needle))
    : options;
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    if (!value) return;
    setQuery(options.find((item) => item.id === value)?.label ?? value);
  }, [value, options]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function place() {
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  function choose(next: string) {
    setQuery(options.find((item) => item.id === next)?.label ?? "");
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={styles.categoryMenu} ref={rootRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        autoComplete="off"
        placeholder="Search"
        className={query ? styles.newEmailSelect : `${styles.newEmailSelect} ${styles.newEmailSelectEmpty}`}
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setActive(0);
          setOpen(true);
          place();
          if (value && next.trim().toLowerCase() !== selectedLabel.trim().toLowerCase()) onChange("");
        }}
        onFocus={() => {
          setActive(0);
          setOpen(true);
          place();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault();
            choose(matches[active].id);
          }
        }}
      />
      {open ? (
        <ul className={styles.categoryList} role="listbox" aria-label={label} style={{ top: box.top, left: box.left, width: box.width, maxHeight: 280, overflow: "auto" }}>
          {matches.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === value}
                className={index === active || item.id === value ? styles.categoryOptionSelected : styles.categoryOption}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item.id)}
              >
                <span>{item.label}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 ? (
            <li className="px-md py-sm text-sm text-gray-medium">No matches</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6.1 2.2h3.8l.35.7H13v1.2H3V2.9h2.75l.35-.7ZM4.15 5.2h7.7l-.55 8.1H4.7L4.15 5.2Z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 4.06 8.9 8 5 11.94 6.05 13 11 8 6.05 3 5 4.06Z" fill="currentColor" />
    </svg>
  );
}
