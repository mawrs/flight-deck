"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import { SearchField } from "./SearchField";
import {
  FILTER_SECTIONS,
  emptyFilters,
  type FilterSectionId,
  type FilterState,
  customChips,
  customFilters,
  groupedChips,
  flatOptions,
  hasGroupableFilters,
  saveCustomFilter,
  optionId,
  productGroups,
  productLeafIds,
  sectionMatches,
  toggleMany,
  toggleValue,
  visibleLeaves,
} from "./filters";
import styles from "./FiltersPanel.module.css";

type FiltersPanelProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose: () => void;
  options?: readonly string[];
};

export function FiltersPanel({ filters, onChange, onClose, options }: FiltersPanelProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<FilterSectionId | null>(null);
  const searching = query.trim().length > 0;

  function expanded(id: FilterSectionId) {
    return searching ? sectionMatches(id, query, filters.customs) : open === id;
  }

  return (
    <aside className={styles.panel} aria-label="Filters">
      <div className={styles.content}>
        <header className={styles.header}>
          <h2>Filters</h2>
          <button className={styles.close} type="button" aria-label="Close filters" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>
        {options ? (
          <div className={styles.plainOptions}>
            {options.map((label) => {
              const id = optionId("option", label);
              return (
                <Check
                  key={id}
                  end
                  label={label}
                  checked={filters.selected.includes(id)}
                  onChange={() => onChange(toggleValue(filters, id))}
                />
              );
            })}
          </div>
        ) : (
          <SearchField
            label="Search filters"
            value={query}
            placeholder="Search filters..."
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        {options ? null : (
        <div className={styles.sections}>
          {FILTER_SECTIONS.filter((section) => sectionMatches(section.id, query, filters.customs)).map((section) => (
            <section key={section.id}>
              <button
                className={styles.section}
                type="button"
                aria-expanded={expanded(section.id)}
                onClick={() => setOpen((current) => (current === section.id ? null : section.id))}
              >
                {section.label}
                <img
                  className={expanded(section.id) ? styles.chevronOpen : styles.chevron}
                  src="/dashboard/angle-right.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              </button>
              {expanded(section.id) ? (
                <div className={styles.options}>
                  <SectionBody section={section.id} query={query} filters={filters} onChange={onChange} />
                </div>
              ) : null}
            </section>
          ))}
        </div>
        )}
      </div>
      <footer className={styles.footer}>
        <Button variant="text" size="small" onClick={() => onChange({ ...emptyFilters, customs: filters.customs })}>
          Clear
        </Button>
        <Button size="small" onClick={onClose}>
          Apply Filters
        </Button>
      </footer>
    </aside>
  );
}

function SectionBody({
  section,
  query,
  filters,
  onChange,
}: {
  section: FilterSectionId;
  query: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  if (section === "custom") return <CustomSection query={query} filters={filters} onChange={onChange} />;
  if (section === "product") return <ProductSection query={query} filters={filters} onChange={onChange} />;
  if (section === "created" || section === "updated") return <DateSection section={section} filters={filters} onChange={onChange} />;
  return <Checklist section={section} query={query} filters={filters} onChange={onChange} />;
}

function Checklist({
  section,
  query,
  filters,
  onChange,
}: {
  section: string;
  query: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const needle = query.trim().toLowerCase();
  const titleMatch = !needle || (FILTER_SECTIONS.find((item) => item.id === section)?.label.toLowerCase().includes(needle) ?? false);
  const options = flatOptions(section).filter((label) => titleMatch || label.toLowerCase().includes(needle));
  const ids = flatOptions(section).map((label) => optionId(section, label));
  const allOn = ids.every((id) => filters.selected.includes(id));

  return (
    <>
      <SelectAll
        checked={allOn}
        onChange={() => onChange(toggleMany(filters, ids, !allOn))}
      />
      {options.map((label) => {
        const id = optionId(section, label);
        return (
          <Check
            key={id}
            label={label}
            checked={filters.selected.includes(id)}
            onChange={() => onChange(toggleValue(filters, id))}
          />
        );
      })}
    </>
  );
}

function ProductSection({
  query,
  filters,
  onChange,
}: {
  query: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const ids = productLeafIds();
  const allOn = ids.every((id) => filters.selected.includes(id));
  const needle = query.trim().toLowerCase();

  return (
    <>
      <SelectAll checked={allOn} onChange={() => onChange(toggleMany(filters, ids, !allOn))} />
      {productGroups().map((group) => {
        const leaves = visibleLeaves(group, query);
        const groupMatches = !needle || group.label.toLowerCase().includes(needle) || leaves.length > 0;
        if (!groupMatches) return null;
        const childIds = group.children.map((leaf) => optionId("product", leaf.id));
        const selectedCount = childIds.filter((id) => filters.selected.includes(id)).length;
        return (
          <div key={group.id}>
            <Check
              label={group.label}
              checked={selectedCount === childIds.length}
              indeterminate={selectedCount > 0 && selectedCount < childIds.length}
              onChange={() => onChange(toggleMany(filters, childIds, selectedCount !== childIds.length))}
            />
            {leaves.map((leaf) => {
              const id = optionId("product", leaf.id);
              return (
                <Check
                  key={id}
                  nested
                  label={leaf.label}
                  checked={filters.selected.includes(id)}
                  onChange={() => onChange(toggleValue(filters, id))}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function CustomSection({
  query,
  filters,
  onChange,
}: {
  query: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const needle = query.trim().toLowerCase();
  const saved = filters.customs.map((card) => ({
    id: card.id,
    label: card.label,
    chips: customChips(card),
  }));
  const cards = [...customFilters(), ...saved].filter(
    (card) => !needle || card.label.toLowerCase().includes(needle) || card.chips.some((chip) => chip.toLowerCase().includes(needle)),
  );
  const preview = groupedChips(filters);

  function startNaming() {
    if (!hasGroupableFilters(filters)) {
      setNaming(false);
      setNotice("Select filters to group first.");
      return;
    }
    setNotice("");
    setNaming(true);
  }

  function cancelNaming() {
    setNaming(false);
    setName("");
    setNotice("");
  }

  function saveNamed(event: FormEvent) {
    event.preventDefault();
    const label = name.trim();
    if (!label || !hasGroupableFilters(filters)) return;
    onChange(saveCustomFilter(filters, label));
    setName("");
    setNaming(false);
    setNotice("");
  }

  return (
    <div className={styles.custom}>
      {naming ? (
        <form className={styles.nameForm} onSubmit={saveNamed}>
          <input
            className={styles.nameInput}
            autoFocus
            aria-label="Custom filter name"
            placeholder="Name this filter"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.stopPropagation();
              cancelNaming();
            }}
          />
          {preview.length > 0 ? (
            <span className={styles.chips}>
              {preview.map((chip) => (
                <span key={chip} className={styles.chip}>
                  {chip}
                </span>
              ))}
            </span>
          ) : null}
          <div className={styles.nameActions}>
            <Button type="button" variant="text" size="small" onClick={cancelNaming}>
              Cancel
            </Button>
            <Button type="submit" size="small" disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <button className={styles.newCustom} type="button" onClick={startNaming}>
          New Custom Filter
          <span aria-hidden="true">+</span>
        </button>
      )}
      {notice ? (
        <p className={styles.nameHint} role="status">
          {notice}
        </p>
      ) : null}
      {cards.map((card) => {
        const id = optionId("custom", card.id);
        const active = filters.selected.includes(id);
        return (
          <button
            key={card.id}
            className={active ? styles.customCardActive : styles.customCard}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setNotice("");
              onChange(toggleValue(filters, id));
            }}
          >
            <span className={styles.customTitle}>{card.label}</span>
            <span className={styles.chips}>
              {card.chips.map((chip) => (
                <span key={chip} className={styles.chip}>
                  {chip}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DateSection({
  section,
  filters,
  onChange,
}: {
  section: "created" | "updated";
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const from = section === "created" ? filters.createdFrom : filters.updatedFrom;
  const to = section === "created" ? filters.createdTo : filters.updatedTo;

  function setBound(bound: "from" | "to", value: string) {
    if (section === "created") {
      onChange(bound === "from" ? { ...filters, createdFrom: value } : { ...filters, createdTo: value });
      return;
    }
    onChange(bound === "from" ? { ...filters, updatedFrom: value } : { ...filters, updatedTo: value });
  }

  return (
    <div className={styles.dates}>
      <DateField label={`${section === "created" ? "Created" : "Updated"} from`} value={from} onChange={(value) => setBound("from", value)} />
      <span aria-hidden="true">–</span>
      <DateField label={`${section === "created" ? "Created" : "Updated"} to`} value={to} onChange={(value) => setBound("to", value)} />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={styles.dateField}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" fill="none" />
        <path d="M2 6.5h12M5 2v2.5M11 2v2.5" stroke="currentColor" />
      </svg>
      <span>{value ? formatShort(value) : "Choose Date"}</span>
      <input type="date" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function formatShort(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}, ${year}`;
}

function SelectAll({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className={styles.selectAll}>
      <Check accent label="Select All" checked={checked} onChange={onChange} />
    </div>
  );
}

function Check({
  label,
  checked,
  indeterminate,
  nested,
  accent,
  end,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  nested?: boolean;
  accent?: boolean;
  end?: boolean;
  onChange: () => void;
}) {
  return (
    <label className={end ? styles.checkEnd : nested ? styles.checkNested : styles.check}>
      <input
        type="checkbox"
        checked={checked}
        ref={(node) => {
          if (node) node.indeterminate = Boolean(indeterminate && !checked);
        }}
        onChange={onChange}
      />
      <span className={styles.box} aria-hidden="true" />
      <span className={accent ? styles.accent : undefined}>{label}</span>
    </label>
  );
}
