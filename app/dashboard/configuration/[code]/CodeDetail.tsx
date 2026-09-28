"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { ORGANIZATION_TYPES, codeTitle, type CodeRow } from "../codes";
import styles from "../configuration.module.css";

export function CodeDetail({ name }: { name: string }) {
  const title = codeTitle(name);
  const [rows, setRows] = useState<CodeRow[]>(() => (name === "Organization Type Codes" ? ORGANIZATION_TYPES : []));
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
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
      <PageHeader
        className={styles.pageHeader}
        eyebrow={
          <>
            <Link href="/dashboard/configuration">System Configurations</Link> &gt; {title}
          </>
        }
        title={title}
      />
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
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.code}>
                  <td>{row.code}</td>
                  <td>{row.description}</td>
                  <td>
                    <button className={styles.deleteLink} type="button" onClick={() => setRows((current) => current.filter((item) => item.code !== row.code))}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableScroll>
        <DataTableFooter>
          <span>
            {visible.length === 0 ? "0" : `1-${visible.length}`} of {query ? visible.length : Math.max(visible.length, 100)}
          </span>
          <span>Rows per page 10</span>
        </DataTableFooter>
      </DataTableCard>
    </Page>
  );
}
