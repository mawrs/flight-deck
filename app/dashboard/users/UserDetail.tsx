"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Page, PageHeader } from "@/components";
import { FloatInput } from "@/components/ui/FloatInput";
import { ROLES, blankUser, consumeNotice, deleteUser, saveUser, useUsers, type UserRecord } from "./users";
import styles from "./users.module.css";

export function UserForm({
  username,
  className,
  onCancel,
  onDeleted,
  onRenamed,
}: {
  username: string;
  className?: string;
  onCancel: () => void;
  onDeleted: () => void;
  onRenamed: (username: string) => void;
}) {
  const users = useUsers();
  const isNew = username === "new";
  const existing = isNew ? null : users.find((record) => record.username === username);
  const [draft, setDraft] = useState<UserRecord>(() => existing ?? blankUser());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
    return <p className={styles.missing}>That user is no longer in the list.</p>;
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
      onRenamed(next.username);
      return;
    }
    setNotice(consumeNotice());
    setDraft(next);
  }

  return (
    <>
      <form className={className ?? styles.form} onSubmit={save}>
        <div className={styles.grid}>
          <FloatInput label="Username" value={draft.username} onChange={(value) => update({ username: value })} />
          <FloatInput label="Email" type="email" value={draft.email} onChange={(value) => update({ email: value })} />
          <FloatInput label="Person Number" value={draft.personNumber} onChange={(value) => update({ personNumber: value })} />
          <FloatInput label="Full Name" value={draft.fullName} onChange={(value) => update({ fullName: value })} />
          <FloatInput label="DNA Person Number" value={draft.dnaPersonNumber} onChange={(value) => update({ dnaPersonNumber: value })} />
          <FloatInput label="NMLS Id (Optional)" value={draft.nmlsId} onChange={(value) => update({ nmlsId: value })} />
          <div className={`uw-float-field ${styles.roles}`} ref={rolesRef}>
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
            <span className="uw-float-label uw-float-label-active" id={`roles-label-${username}`}>
              Roles
            </span>
            {rolesOpen ? (
              <div className={styles.popover} role="listbox" aria-labelledby={`roles-label-${username}`}>
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
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {notice ? <p className={styles.saved}>{notice}</p> : null}
        <div className={styles.formFooter}>
          {isNew ? null : (
            <>
              <Button variant="danger" size="small" onClick={() => setConfirming(true)}>
                Delete User
              </Button>
              <Button variant="outline" size="small" onClick={() => setNotice(`Password reset email sent to ${draft.email}.`)}>
                Reset Password
              </Button>
              <Button variant="outline" size="small" onClick={() => setNotice(`Confirmation email sent to ${draft.email}.`)}>
                Resend Email Confirmation
              </Button>
            </>
          )}
          <Button variant="outline" size="small" onClick={onCancel}>
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
                  deleteUser(existing.username);
                  onDeleted();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function UserDetail({ username }: { username: string }) {
  const router = useRouter();
  const users = useUsers();
  const isNew = username === "new";
  const existing = isNew ? null : users.find((record) => record.username === username);

  if (!isNew && !existing) {
    return (
      <Page flush>
        <PageHeader className={styles.pageHeader} title="User not found" />
        <p className={styles.missing}>That user is no longer in the list.</p>
      </Page>
    );
  }

  return (
    <Page flush>
      <PageHeader className={styles.pageHeader} title={isNew ? "Create User" : existing?.fullName} />
      <UserForm
        key={username}
        username={username}
        onCancel={() => router.push("/dashboard/users")}
        onDeleted={() => router.push("/dashboard/users")}
        onRenamed={(next) => router.replace(`/dashboard/users/${encodeURIComponent(next)}`)}
      />
    </Page>
  );
}
