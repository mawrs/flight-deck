"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Button,
  DataTable,
  DataTableCard,
  DataTableFooter,
  DataTableScroll,
  DataTableToolbar,
  Page,
  PageHeader,
  SearchField,
} from "@/components";
import { codeTitle, codesFor, type CodeRow } from "../codes";
import styles from "../configuration.module.css";

export function CodeDetail({ name }: { name: string }) {
  const title = codeTitle(name);
  const [rows, setRows] = useState<CodeRow[]>(() => codesFor(name));
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.code} ${row.description}`.toLowerCase().includes(q));
  }, [query, rows]);

  function exportRows() {
    const body = ["Code,Description", ...rows.map((row) => `${row.code},${row.description}`)].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page flush>
      <PageHeader className={styles.pageHeader} title={title} />
      <DataTableCard rules>
        <DataTableToolbar>
          <SearchField
            value={query}
            placeholder={`Search all ${title.toLowerCase()}s...`}
            label={`Search ${title}`}
            onChange={(event) => setQuery(event.target.value)}
          />
        <Button size="small" onClick={() => setAdding((open) => !open)}>
          + Add
        </Button>
        <Button variant="outline" size="small" onClick={exportRows}>
          + Export to Excel
        </Button>
        </DataTableToolbar>
        {adding ? (
          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              if (!code.trim()) return;
              setRows((current) => [...current, { code: code.trim().toUpperCase(), description: description.trim() }]);
              setCode("");
              setDescription("");
              setAdding(false);
            }}
          >
            <input value={code} placeholder="Code" aria-label="Code" onChange={(event) => setCode(event.target.value)} />
            <input value={description} placeholder="Description" aria-label="Description" onChange={(event) => setDescription(event.target.value)} />
            <Button size="small" type="submit">
              Add
            </Button>
          </form>
        ) : null}
        <DataTableScroll>
          <DataTable density="compact">
            <thead>
              <tr>
                <th>{title} Code</th>
                <th>Description</th>
                <th className={styles.rowActions} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <Fragment key={row.code}>
                <tr>
                  <td>
                    {editingCode === row.code ? (
                      <input
                        className={styles.cellInput}
                        aria-label={`${row.code} code`}
                        value={editValue}
                        onChange={(event) => {
                          setEditValue(event.target.value);
                          setEditError("");
                        }}
                      />
                    ) : (
                      row.code
                    )}
                  </td>
                  <td>
                    {editingCode === row.code ? (
                      <input
                        className={styles.cellInput}
                        aria-label={`${row.code} description`}
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                      />
                    ) : (
                      row.description
                    )}
                  </td>
                  <td className={styles.rowActions}>
                    {editingCode === row.code ? (
                      <button
                        className={styles.editLink}
                        type="button"
                        onClick={() => {
                          const nextCode = editValue.trim().toUpperCase();
                          if (!nextCode) {
                            setEditError("Code is required.");
                            return;
                          }
                          const taken = rows.some((item) => item.code !== row.code && item.code.toUpperCase() === nextCode);
                          if (taken) {
                            setEditError("That code is already in use.");
                            return;
                          }
                          setRows((current) =>
                            current.map((item) =>
                              item.code === row.code ? { code: nextCode, description: editDescription.trim() } : item,
                            ),
                          );
                          setEditingCode(null);
                          setEditError("");
                        }}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        className={styles.editLink}
                        type="button"
                        onClick={() => {
                          setEditingCode(row.code);
                          setEditValue(row.code);
                          setEditDescription(row.description);
                          setEditError("");
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button className={styles.deleteLink} type="button" onClick={() => setRows((current) => current.filter((item) => item.code !== row.code))}>
                      Delete
                    </button>
                  </td>
                </tr>
                {editingCode === row.code && editError ? (
                  <tr>
                    <td className={styles.editError} colSpan={3}>
                      {editError}
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              ))}
            </tbody>
          </DataTable>
        </DataTableScroll>
        <DataTableFooter>
          <span>
            {visible.length === 0 ? "0" : `1-${visible.length}`} of {rows.length}
          </span>
          <span>Rows per page 10</span>
        </DataTableFooter>
      </DataTableCard>
    </Page>
  );
}
