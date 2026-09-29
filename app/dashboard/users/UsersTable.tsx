"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DataTable,
  DataTableCard,
  DataTableFooter,
  DataTableScroll,
  DataTableToolbar,
  Page,
  PageHeader,
  Pagination,
  SearchField,
} from "@/components";
import { UserForm } from "./UserDetail";
import { useUsers } from "./users";
import styles from "./users.module.css";

const PAGE_SIZES = [10, 25, 50];

function Plus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M7.2 2h1.6v5.2H14v1.6H8.8V14H7.2V8.8H2V7.2h5.2V2Z" fill="currentColor" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.2 2.8l2 2-8.4 8.4H2.8v-2L11.2 2.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 4l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const COLUMNS = 7;

export function UsersTable() {
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [synced, setSynced] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const filteredRef = useRef<typeof users>([]);
  const pageSizeRef = useRef(pageSize);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...users].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: "base" }));
    if (!q) return rows;
    return rows.filter((row) =>
      [row.username, row.email, row.fullName, row.personNumber].join(" ").toLowerCase().includes(q),
    );
  }, [query, users]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = filtered.length === 0 ? 0 : (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  filteredRef.current = filtered;
  pageSizeRef.current = pageSize;

  useEffect(() => {
    if (!editing || editing === "new") return;
    const index = filteredRef.current.findIndex((row) => row.username === editing);
    if (index < 0) return;
    setPage(Math.floor(index / pageSizeRef.current) + 1);
  }, [editing]);

  function toggleEdit(username: string) {
    setEditing((currentId) => (currentId === username ? null : username));
  }

  return (
    <Page flush>
      <PageHeader className={styles.pageHeader} title="Manage Users" />
      <DataTableCard rules>
        <DataTableToolbar>
          <SearchField
            containerClassName={styles.userSearch}
            label="Search users"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <div className={styles.toolbarActions}>
            <Button size="small" icon={<Plus />} aria-expanded={editing === "new"} onClick={() => toggleEdit("new")}>
              Create User
            </Button>
            <Button variant="outline" size="small" onClick={() => setSynced(true)}>
              Sync User Emails
            </Button>
          </div>
        </DataTableToolbar>
        {synced ? <p className={styles.notice}>User emails synced.</p> : null}
        <DataTableScroll>
          <DataTable density="compact">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Person Number</th>
                <th>Verified Email</th>
                <th>Locked Out</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {editing === "new" ? (
                <tr className={styles.expandRow}>
                  <td className={styles.expandCell} colSpan={COLUMNS}>
                    <UserForm
                      key="new"
                      username="new"
                      className={styles.inlineForm}
                      onCancel={() => setEditing(null)}
                      onDeleted={() => setEditing(null)}
                      onRenamed={setEditing}
                    />
                  </td>
                </tr>
              ) : null}
              {visible.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={COLUMNS}>
                    No matching users
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const open = editing === row.username;
                  return (
                    <Fragment key={row.username}>
                      <tr className={open ? styles.rowOpen : undefined}>
                        <td className={styles.strong}>{row.username}</td>
                        <td>{row.email}</td>
                        <td>{row.fullName}</td>
                        <td>{row.personNumber}</td>
                        <td>{row.verifiedEmail ? "True" : "False"}</td>
                        <td>{row.lockedOut ? "True" : "False"}</td>
                        <td className={styles.actions}>
                          <Button variant="link" size="small" icon={<Pencil />} aria-expanded={open} onClick={() => toggleEdit(row.username)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className={styles.expandRow}>
                          <td className={styles.expandCell} colSpan={COLUMNS}>
                            <UserForm
                              key={row.username}
                              username={row.username}
                              className={styles.inlineForm}
                              onCancel={() => setEditing(null)}
                              onDeleted={() => setEditing(null)}
                              onRenamed={setEditing}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </DataTable>
        </DataTableScroll>
        <DataTableFooter>
          <Pagination
            count={filtered.length}
            page={current}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </DataTableFooter>
      </DataTableCard>
    </Page>
  );
}
