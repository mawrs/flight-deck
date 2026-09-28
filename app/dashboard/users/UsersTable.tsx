"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export function UsersTable() {
  const router = useRouter();
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [synced, setSynced] = useState(false);

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

  function openUser(username: string) {
    router.push(`/dashboard/users/${encodeURIComponent(username)}`);
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
            <Button size="small" icon={<Plus />} onClick={() => router.push("/dashboard/users/new")}>
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
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={6}>
                    No matching users
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr
                    key={row.username}
                    className={styles.row}
                    tabIndex={0}
                    onClick={() => openUser(row.username)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && event.target === event.currentTarget) openUser(row.username);
                    }}
                  >
                    <td className={styles.strong}>{row.username}</td>
                    <td>{row.email}</td>
                    <td>{row.fullName}</td>
                    <td>{row.personNumber}</td>
                    <td>{row.verifiedEmail ? "True" : "False"}</td>
                    <td>{row.lockedOut ? "True" : "False"}</td>
                  </tr>
                ))
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
