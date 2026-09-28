"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Page, PageHeader, SearchField } from "@/components";
import { CODE_NAMES, codeSlug } from "./codes";
import styles from "./configuration.module.css";

type Item = { name: string; tags: string[] };

export function SystemConfigurations() {
  const router = useRouter();
  const [saved, setSaved] = useState<Item[]>(() => CODE_NAMES.map((name) => ({ name, tags: [] })));
  const [draft, setDraft] = useState<Item[] | null>(null);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [openTag, setOpenTag] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ name: string; tag: string } | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [dontAsk, setDontAsk] = useState(false);
  const editing = draft !== null;
  const items = draft ?? saved;

  const tags = useMemo(() => [...new Set(items.flatMap((item) => item.tags))].sort(), [items]);
  const visible = items.filter((item) => {
    if (tagFilter && !item.tags.includes(tagFilter)) return false;
    return item.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  function update(name: string, tagsForRow: string[]) {
    const next = items.map((item) => (item.name === name ? { ...item, tags: tagsForRow } : item));
    if (editing) setDraft(next);
    else setSaved(next);
  }

  function addTag(name: string, tag: string) {
    const value = tag.trim();
    if (!value) return;
    const item = items.find((row) => row.name === name);
    if (!item || item.tags.includes(value)) return;
    update(name, [...item.tags, value]);
    setNewTag("");
    setOpenTag(null);
  }

  function requestRemove(name: string, tag: string) {
    if (skipConfirm) removeTag(tag);
    else setPendingDelete({ name, tag });
  }

  function removeTag(tag: string) {
    const next = items.map((item) => ({ ...item, tags: item.tags.filter((value) => value !== tag) }));
    if (editing) setDraft(next);
    else setSaved(next);
    if (tagFilter === tag) setTagFilter(null);
    setPendingDelete(null);
  }

  const affected = pendingDelete ? items.filter((item) => item.tags.includes(pendingDelete.tag)).map((item) => item.name) : [];

  return (
    <Page flush>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="System Configurations"
        title="System Configurations"
        actions={
          editing ? (
            <>
              <Button
                size="small"
                onClick={() => {
                  if (draft) setSaved(draft);
                  setDraft(null);
                }}
              >
                Save Changes
              </Button>
              <Button variant="outline" size="small" className={styles.danger} onClick={() => setDraft(null)}>
                Discard Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="small" onClick={() => setDraft(saved.map((item) => ({ ...item, tags: [...item.tags] })))}>
              Edit Tags
            </Button>
          )
        }
      />
      <div className={styles.body}>
      <SearchField
        label="Search configuration items"
        value={query}
        placeholder="Search all configuration items..."
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.chips}>
        <button className={tagFilter ? styles.chip : styles.chipActive} type="button" onClick={() => setTagFilter(null)}>
          All tags
        </button>
        {tags.map((tag) => (
          <span key={tag} className={tagFilter === tag ? styles.chipActive : styles.chip}>
            <button type="button" onClick={() => setTagFilter(tag)}>
              {tag}
            </button>
            <button type="button" aria-label={`Delete ${tag}`} onClick={() => requestRemove(items.find((item) => item.tags.includes(tag))?.name ?? "", tag)}>
              ×
            </button>
          </span>
        ))}
      </div>
      </div>
      <div className={styles.list}>
        {visible.map((item) => (
          <div className={styles.row} key={item.name}>
            <button className={styles.rowName} type="button" onClick={() => router.push(`/dashboard/configuration/${codeSlug(item.name)}`)}>
              <Bars />
              {item.name}
            </button>
            <div className={styles.rowTags}>
              {item.tags.map((tag) => (
                <span className={styles.tag} key={tag}>
                  {tag}
                  <button type="button" aria-label={`Remove ${tag}`} onClick={() => requestRemove(item.name, tag)}>
                    ×
                  </button>
                </span>
              ))}
              <button className={styles.addTag} type="button" aria-expanded={openTag === item.name} onClick={() => setOpenTag(openTag === item.name ? null : item.name)}>
                + Tag
              </button>
            </div>
            {openTag === item.name ? (
              <div className={styles.popover}>
                {tags.filter((tag) => !item.tags.includes(tag)).length === 0 ? <p>No tags available.</p> : null}
                {tags
                  .filter((tag) => !item.tags.includes(tag))
                  .map((tag) => (
                    <button key={tag} className={styles.option} type="button" onClick={() => addTag(item.name, tag)}>
                      {tag}
                    </button>
                  ))}
                <form
                  className={styles.addRow}
                  onSubmit={(event) => {
                    event.preventDefault();
                    addTag(item.name, newTag);
                  }}
                >
                  <input value={newTag} placeholder="New tag..." aria-label="New tag" onChange={(event) => setNewTag(event.target.value)} />
                  <Button size="small" type="submit">
                    Add
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {pendingDelete ? (
        <div className={styles.overlay} role="presentation" onMouseDown={() => setPendingDelete(null)}>
          <div className={styles.modal} role="dialog" aria-labelledby="delete-tags-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHead}>
              <h2 id="delete-tags-title">Delete Tags</h2>
              <button type="button" aria-label="Close" onClick={() => setPendingDelete(null)}>
                ×
              </button>
            </div>
            <p>
              Deleting the <strong>{pendingDelete.tag}</strong> tag will affect {affected.length} {affected.length === 1 ? "code" : "codes"}:
            </p>
            <ul className={styles.affected}>
              {affected.map((name) => (
                <li key={name}>{codeTitle(name)}</li>
              ))}
            </ul>
            <label className={styles.check}>
              <input type="checkbox" checked={dontAsk} onChange={(event) => setDontAsk(event.target.checked)} />
              Do not ask me this again.
            </label>
            <div className={styles.modalActions}>
              <Button variant="outline" size="small" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="small"
                className={styles.danger}
                onClick={() => {
                  if (dontAsk) setSkipConfirm(true);
                  removeTag(pendingDelete.tag);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

function codeTitle(name: string) {
  return name.replace(/ Codes$/, "");
}

function Bars() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
