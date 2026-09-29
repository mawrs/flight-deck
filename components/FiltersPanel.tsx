"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import { SearchField } from "./SearchField";
import {
  FILTER_SECTIONS,
  emptyFilters,
  type FilterSectionId,
  type FilterState,
  createCustomFilter,
  deleteCustomFilter,
  customChips,
  customDraft,
  customFilters,
  filterTags,
  flatOptions,
  hasGroupableFilters,
  optionId,
  productGroups,
  productLeafIds,
  removeTag,
  sectionMatches,
  sectionSelectionCount,
  updateCustomFilter,
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

const EDITOR_SECTIONS = FILTER_SECTIONS.filter((section) => section.id !== "custom");

export function FiltersPanel({ filters, onChange, onClose, options }: FiltersPanelProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<FilterSectionId | null>(null);
  const [editor, setEditor] = useState<FilterState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const searching = query.trim().length > 0;
  const editing = editor !== null;
  const view = editor ?? filters;
  const draftTags = editing ? selectionTags(view) : [];
  const canSave = name.trim().length > 0 && hasGroupableFilters(view);

  function expanded(id: FilterSectionId) {
    if (editing) return open === id;
    return searching ? sectionMatches(id, query, filters.customs) : open === id;
  }

  function startEditor() {
    setEditingId(null);
    setName("");
    setEditor({ ...emptyFilters });
    setOpen(null);
  }

  function editCustom(id: string) {
    const current = customDraft(filters, id);
    if (!current) return;
    setEditingId(id);
    setName(current.label);
    setEditor(current.draft);
    setOpen(null);
  }

  function closeEditor() {
    setEditor(null);
    setEditingId(null);
    setName("");
    setOpen("custom");
  }

  function saveEditor(event: FormEvent) {
    event.preventDefault();
    if (!editor || !canSave) return;
    onChange(editingId ? updateCustomFilter(filters, editingId, editor, name) : createCustomFilter(filters, editor, name));
    closeEditor();
  }

  function deleteEditor() {
    if (editingId) onChange(deleteCustomFilter(filters, editingId));
    closeEditor();
  }

  const sections = (editing ? EDITOR_SECTIONS : FILTER_SECTIONS).filter((section) =>
    editing ? true : sectionMatches(section.id, query, filters.customs),
  );

  return (
    <aside className={styles.panel} aria-label={editing ? "Edit custom filter" : "Filters"}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2>{editing ? "Edit Custom Filter" : "Filters"}</h2>
          <button
            className={styles.close}
            type="button"
            aria-label={editing ? "Back to filters" : "Close filters"}
            onClick={editing ? closeEditor : onClose}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>
        {editing ? (
          <form className={styles.editorCard} onSubmit={saveEditor}>
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
                closeEditor();
              }}
            />
            {draftTags.length > 0 ? (
              <span className={styles.chips}>
                {draftTags.map((tag) => (
                  <span key={tag.id} className={`${styles.chip} ${styles.chipRemovable}`}>
                    {tag.label}
                    <button
                      className={styles.chipRemove}
                      type="button"
                      aria-label={`Remove ${tag.label}`}
                      onClick={() => setEditor(removeTag(view, tag.id))}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </span>
                ))}
              </span>
            ) : null}
            <hr className={styles.editorDivider} />
            <div className={styles.editorActions}>
              <Button type="button" variant="outline" size="small" onClick={closeEditor}>
                Cancel Changes
              </Button>
              <Button type="submit" size="small" disabled={!canSave}>
                Save Filter
              </Button>
            </div>
          </form>
        ) : options ? (
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
        {options && !editing ? null : (
        <div className={styles.sections}>
          {sections.map((section) => {
            const count = editing ? sectionSelectionCount(section.id, view) : 0;
            return (
            <section key={section.id}>
              <button
                className={styles.section}
                type="button"
                aria-expanded={expanded(section.id)}
                onClick={() => setOpen((current) => (current === section.id ? null : section.id))}
              >
                <span className={styles.sectionTitle}>
                  {section.label}
                  {count > 0 ? (
                    <span className={styles.count} aria-label={`${count} selected`}>
                      {count}
                    </span>
                  ) : null}
                </span>
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
                  <SectionBody
                    section={section.id}
                    query={editing ? "" : query}
                    filters={view}
                    marked={editing}
                    onChange={editing ? setEditor : onChange}
                    onCreate={startEditor}
                    onEdit={editCustom}
                  />
                </div>
              ) : null}
            </section>
            );
          })}
        </div>
        )}
      </div>
      <footer className={editing ? styles.deleteFooter : styles.footer}>
        {editing ? (
          <Button type="button" variant="error" fullWidth onClick={deleteEditor}>
            Delete Custom Filter
          </Button>
        ) : (
          <>
            <Button variant="text" size="small" onClick={() => onChange({ ...emptyFilters, customs: filters.customs, hidden: filters.hidden })}>
              Clear
            </Button>
            <Button size="small" onClick={onClose}>
              Apply Filters
            </Button>
          </>
        )}
      </footer>
    </aside>
  );
}

function selectionTags(state: FilterState) {
  const tags: { id: string; label: string }[] = [];
  productGroups().forEach((group) => {
    group.children.forEach((leaf) => {
      const id = optionId("product", leaf.id);
      if (state.selected.includes(id)) tags.push({ id, label: leaf.label });
    });
  });
  for (const section of ["assignee", "request", "status", "kyc", "task", "kycTag", "branch"] as const) {
    flatOptions(section).forEach((label) => {
      const id = optionId(section, label);
      if (state.selected.includes(id)) tags.push({ id, label });
    });
  }
  filterTags(state)
    .filter((tag) => tag.id.startsWith("date:"))
    .forEach((tag) => tags.push(tag));
  return tags;
}

function SectionBody({
  section,
  query,
  filters,
  marked,
  onChange,
  onCreate,
  onEdit,
}: {
  section: FilterSectionId;
  query: string;
  filters: FilterState;
  marked?: boolean;
  onChange: (filters: FilterState) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  if (section === "custom") return <CustomSection query={query} filters={filters} onChange={onChange} onCreate={onCreate} onEdit={onEdit} />;
  if (section === "product") return <ProductSection query={query} filters={filters} marked={marked} onChange={onChange} />;
  if (section === "created" || section === "updated") return <DateSection section={section} filters={filters} onChange={onChange} />;
  return <Checklist section={section} query={query} filters={filters} marked={marked} onChange={onChange} />;
}

function Checklist({
  section,
  query,
  filters,
  marked,
  onChange,
}: {
  section: string;
  query: string;
  filters: FilterState;
  marked?: boolean;
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
            picked={marked && filters.selected.includes(id)}
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
  marked,
  onChange,
}: {
  query: string;
  filters: FilterState;
  marked?: boolean;
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
              picked={marked && selectedCount === childIds.length}
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
                  picked={marked && filters.selected.includes(id)}
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
  onCreate,
  onEdit,
}: {
  query: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const savedIds = new Set(filters.customs.map((card) => card.id));
  const saved = filters.customs
    .filter((card) => !filters.hidden.includes(card.id))
    .map((card) => ({
      id: card.id,
      label: card.label,
      chips: customChips(card),
    }));
  const presets = customFilters()
    .filter((card) => !filters.hidden.includes(card.id) && !savedIds.has(card.id))
    .map((card) => ({ id: card.id, label: card.label, chips: [...card.chips] }));
  const cards = [...presets, ...saved].filter(
    (card) => !needle || card.label.toLowerCase().includes(needle) || card.chips.some((chip) => chip.toLowerCase().includes(needle)),
  );

  return (
    <div className={styles.custom}>
      <button className={styles.newCustom} type="button" onClick={onCreate}>
        New Custom Filter
        <span aria-hidden="true">+</span>
      </button>
      {cards.map((card) => {
        const id = optionId("custom", card.id);
        const active = filters.selected.includes(id);
        return (
          <div key={card.id} className={`${active ? styles.customCardActive : styles.customCard} ${styles.customOwned}`}>
            <button className={styles.customBody} type="button" aria-pressed={active} onClick={() => onChange(toggleValue(filters, id))}>
              <span className={styles.customTitle}>{card.label}</span>
              <span className={styles.chips}>
                {card.chips.map((chip) => (
                  <span key={chip} className={styles.chip}>
                    {chip}
                  </span>
                ))}
              </span>
            </button>
            <button className={styles.customEdit} type="button" onClick={() => onEdit(card.id)}>
              Edit
            </button>
          </div>
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
  picked,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  nested?: boolean;
  accent?: boolean;
  end?: boolean;
  picked?: boolean;
  onChange: () => void;
}) {
  const row = end ? styles.checkEnd : nested ? styles.checkNested : styles.check;
  return (
    <label className={picked ? `${row} ${styles.picked}` : row}>
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
