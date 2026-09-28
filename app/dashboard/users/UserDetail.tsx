"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Divider, Page, PageHeader, TextField } from "@/components";
import { ROLES, blankUser, consumeNotice, deleteUser, saveUser, useUsers, type UserRecord } from "./users";
import styles from "./users.module.css";

export function UserDetail({ username }: { username: string }) {
  const router = useRouter();
  const users = useUsers();
  const isNew = username === "new";
  const existing = isNew ? null : users.find((record) => record.username === username);
  const [draft, setDraft] = useState<UserRecord>(() => existing ?? blankUser());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removed, setRemoved] = useState(false);
  const rolesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const message = consumeNotice();
    if (message) setNotice(message);
  }, []);

  useEffect(() => {
    if (!rolesOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!rolesRef.current?.contains(event.target as Node)) setRolesOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setRolesOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [rolesOpen]);

  if (!isNew && !existing) {
    if (removed) return <Page />;
    return (
      <Page>
        <PageHeader eyebrow={<Link href="/dashboard/users">Manage Users</Link>} title="User not found" />
        <p className={styles.missing}>That user is no longer in the list.</p>
      </Page>
    );
  }

  const available = ROLES.filter((role) => !draft.roles.includes(role));

  function update(patch: Partial<UserRecord>) {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
    setNotice("");
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const next: UserRecord = {
      ...draft,
      username: draft.username.trim(),
      email: draft.email.trim(),
      fullName: draft.fullName.trim(),
      personNumber: draft.personNumber.trim(),
      nmlsId: draft.nmlsId.trim(),
      dnaPersonNumber: draft.dnaPersonNumber.trim() || "0",
    };
    if (!next.username || !next.email || !next.fullName || !next.personNumber) {
      setError("Username, email, full name, and person number are required.");
      return;
    }
    const taken = users.some(
      (record) => record.username.toLowerCase() === next.username.toLowerCase() && record.username !== username,
    );
    if (taken || next.username.toLowerCase() === "new") {
      setError("That username is already in use.");
      return;
    }
    saveUser(isNew ? null : username, next);
    if (isNew || next.username !== username) {
      router.replace(`/dashboard/users/${encodeURIComponent(next.username)}`);
      return;
    }
    setNotice(consumeNotice());
    setDraft(next);
  }

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href="/dashboard/users">Manage Users</Link> &gt; {isNew ? "Create User" : existing?.fullName}
          </>
        }
        title={isNew ? "Create User" : existing?.fullName}
      />
      <form className={`${styles.card} ${styles.form}`} onSubmit={save}>
        <div className={styles.grid}>
          <TextField showLabel label="Username" name="username" value={draft.username} onChange={(event) => update({ username: event.target.value })} />
          <TextField showLabel label="Email" name="email" type="email" value={draft.email} onChange={(event) => update({ email: event.target.value })} />
          <TextField
            showLabel
            label="Person Number"
            name="personNumber"
            value={draft.personNumber}
            onChange={(event) => update({ personNumber: event.target.value })}
          />
          {isNew ? null : (
            <div className={styles.sideActions}>
              <Button className={styles.danger} variant="text" size="small" onClick={() => setConfirming(true)}>
                Delete User
              </Button>
              <Button variant="text" size="small" onClick={() => setNotice(`Password reset email sent to ${draft.email}.`)}>
                Reset Password
              </Button>
              <Button variant="text" size="small" onClick={() => setNotice(`Confirmation email sent to ${draft.email}.`)}>
                Resend Email Confirmation
              </Button>
            </div>
          )}
          <TextField showLabel label="Full Name" name="fullName" value={draft.fullName} onChange={(event) => update({ fullName: event.target.value })} />
        </div>
        <Divider />
        <div className={styles.roles} ref={rolesRef}>
          <span className={styles.fieldLabel} id="roles-label">
            Roles
          </span>
          <div className={styles.roleBox}>
            {draft.roles.map((role) => (
              <span key={role} className={styles.tag}>
                {role}
                <button type="button" aria-label={`Remove ${role}`} onClick={() => update({ roles: draft.roles.filter((item) => item !== role) })}>
                  ×
                </button>
              </span>
            ))}
            <button className={styles.addRole} type="button" aria-expanded={rolesOpen} onClick={() => setRolesOpen((open) => !open)}>
              Add role
            </button>
            {draft.roles.length > 0 ? (
              <button className={styles.clearRoles} type="button" aria-label="Clear roles" onClick={() => update({ roles: [] })}>
                ×
              </button>
            ) : null}
          </div>
          {rolesOpen ? (
            <div className={styles.popover} role="listbox" aria-labelledby="roles-label">
              {available.length === 0 ? <p className={styles.missing}>All roles are assigned.</p> : null}
              {available.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    update({ roles: [...draft.roles, role] });
                    setRolesOpen(false);
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.pair}>
          <TextField
            showLabel
            label="DNA Person Number"
            name="dnaPersonNumber"
            value={draft.dnaPersonNumber}
            onChange={(event) => update({ dnaPersonNumber: event.target.value })}
          />
          <TextField showLabel label="NMLS Id (Optional)" name="nmlsId" value={draft.nmlsId} onChange={(event) => update({ nmlsId: event.target.value })} />
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {notice ? <p className={styles.saved}>{notice}</p> : null}
        <div className={styles.formFooter}>
          <Button variant="outline" size="small" onClick={() => router.push("/dashboard/users")}>
            Cancel
          </Button>
          <Button size="small" type="submit">
            Save
          </Button>
        </div>
      </form>
      {confirming && existing ? (
        <div className={styles.overlay} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
            <h2 id="delete-user-title">Delete {existing.username}?</h2>
            <p>This removes {existing.fullName} from Manage Users.</p>
            <div className={styles.modalActions}>
              <Button variant="outline" size="small" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => {
                  setRemoved(true);
                  deleteUser(existing.username);
                  router.push("/dashboard/users");
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
