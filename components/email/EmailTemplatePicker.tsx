"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import styles from "@/app/dashboard/[id]/details.module.css";

const EMAIL_CATEGORIES = [
  "New Account Open",
  "Cancelled",
  "Rejection/Decline",
  "Joint Owner",
  "Security/Verification",
  "Additional Items",
  "Marketing",
  "Follow Up",
  "In Branch",
];

const EMAIL_TEMPLATES: Record<string, string[]> = {
  "New Account Open": ["Welcome", "Account is now open", "Online banking setup", "Direct deposit instructions"],
  Cancelled: ["Application cancelled", "Account closure confirmation"],
  "Rejection/Decline": ["General Rejection", "Qualifile", "Unable to verify identity"],
  "Joint Owner": ["Application Invitation", "Joint owner added", "Invitation reminder"],
  "Security/Verification": ["Self Serve OTP", "Password Reset", "Verify your email"],
  "Additional Items": ["Document request", "Missing signature", "Funding source needed"],
  Marketing: ["Experience the benefits of SouthEast Bank", "New rate offer", "Referral invitation"],
  "Follow Up": ["Continue your application", "Application Drop Off", "We haven't heard from you"],
  "In Branch": ["Appointment confirmation", "In-branch application received", "Branch visit follow-up"],
};

function templatesFor(category: string) {
  return EMAIL_TEMPLATES[category] ?? [];
}

export function EmailTemplatePicker({
  idPrefix = "email",
  onCancel,
  onNext,
}: {
  idPrefix?: string;
  onCancel: () => void;
  onNext: (template: string) => void;
}) {
  const [category, setCategory] = useState("");
  const [template, setTemplate] = useState("");
  const templates = templatesFor(category);

  return (
    <div className={styles.newEmail}>
      <div className={styles.newEmailHead}>New Email</div>
      <div className={styles.newEmailBody}>
        <div className={styles.newEmailStep}>
          <span className={styles.newEmailNumber}>1</span>
          <div className={styles.newEmailField}>
            <label htmlFor={`${idPrefix}-category`}>Choose email Category</label>
            <OptionMenu
              id={`${idPrefix}-category`}
              label="Choose email Category"
              options={EMAIL_CATEGORIES}
              value={category}
              onChange={(next) => {
                setCategory(next);
                setTemplate("");
              }}
            />
          </div>
        </div>
        <div className={styles.newEmailStep}>
          <span className={styles.newEmailNumber}>2</span>
          <div className={styles.newEmailField}>
            <label htmlFor={`${idPrefix}-template`}>Choose a template for{category ? ` ${category}` : ""}</label>
            <OptionMenu
              id={`${idPrefix}-template`}
              label={category ? `Choose a template for ${category}` : "Choose a template"}
              options={templates}
              value={template}
              disabled={!category}
              onChange={setTemplate}
            />
          </div>
        </div>
        <div className={styles.newEmailActions}>
          <Button variant="link" size="small" icon={<TrashIcon />} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="small"
            className={styles.newEmailNext}
            disabled={!category || !template}
            onClick={() => onNext(template)}
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionMenu({
  id,
  label,
  options,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (disabled) setMenuOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!menuOpen || !buttonRef.current) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    place();
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuOpen]);

  return (
    <div className={styles.categoryMenu} ref={rootRef}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={value ? styles.newEmailSelect : `${styles.newEmailSelect} ${styles.newEmailSelectEmpty}`}
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
          setMenuOpen((current) => !current);
        }}
      >
        {value || "Select one"}
      </button>
      {menuOpen ? (
        <ul
          className={styles.categoryList}
          role="listbox"
          aria-label={label}
          style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
        >
          {options.map((name) => {
            const selected = name === value;
            return (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? styles.categoryOptionSelected : styles.categoryOption}
                  onClick={() => {
                    onChange(name);
                    setMenuOpen(false);
                  }}
                >
                  <span>{name}</span>
                  {selected ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.2 10.2 8.7 12.6 13.8 7.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
