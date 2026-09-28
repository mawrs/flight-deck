"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { DropdownItem } from "./ui/Dropdown";
import styles from "./AssignMenu.module.css";

const ASSIGNEES = ["Ellie Grimshaw", "Jasper Lovelace", "Alistair Bloom", "Genevieve Quince", "Unassigned"];

type AssignMenuProps = {
  value: string;
  onCancel: () => void;
  onAssign: (name: string) => void;
};

export function AssignMenu({ value, onCancel, onAssign }: AssignMenuProps) {
  const listId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState(0);
  const [moved, setMoved] = useState(false);
  const names = ASSIGNEES.includes(value) ? ASSIGNEES : [value, ...ASSIGNEES];
  const matches = names.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const target = event.target as Element;
      if (menuRef.current?.contains(target)) return;
      if (target.closest("[data-assign-trigger]")) return;
      onCancel();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  function move(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMoved(true);
      setActive((index) => Math.min(matches.length - 1, index + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMoved(true);
      setActive((index) => Math.max(0, index - 1));
    }
    if (event.key === "Enter" && matches[active]) {
      event.preventDefault();
      setDraft(matches[active]);
    }
  }

  return (
    <div ref={menuRef} className={styles.menu} role="dialog" aria-label="Assign to a team member">
      <div className={styles.head}>
        <p>Assign to a team member</p>
        <label className={styles.search}>
          <img src="/dashboard/search.svg" alt="" width={11} height={11} />
          <input
            ref={searchRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Search assignees"
            placeholder="Search assignees..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={move}
          />
        </label>
      </div>
      <Divider />
      <div id={listId} className={`${styles.list} uw-dropdown`} role="listbox" aria-label="Team members">
        {matches.length === 0 ? <p className={styles.empty}>No matching team members</p> : null}
        {matches.map((name, index) => (
          <DropdownItem
            key={name}
            role="option"
            selected={name === draft}
            active={moved && index === active}
            onMouseEnter={() => setActive(index)}
            onClick={() => setDraft(name)}
          >
            {name}
          </DropdownItem>
        ))}
      </div>
      <div className={styles.footer}>
        <Divider />
        <div className={styles.actions}>
          <Button variant="outline" size="small" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" type="button" onClick={() => onAssign(draft)}>
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
