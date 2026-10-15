"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ops/Avatar";
import { MentionText } from "@/components/ops/MentionText";
import { servicingCaseHref } from "@/lib/loan-routes";
import { useOps } from "@/lib/ops-store";
import type { OpsNotification } from "@/lib/ops-types";
import styles from "./notifications.module.css";

export function Notifications() {
  const ops = useOps();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const notes = [...(ops.notifications ?? [])].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const unread = notes.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.menu} ref={menuRef}>
      <button
        className={styles.bell}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => setOpen((current) => !current)}
      >
        <BellIcon />
        {unread > 0 ? <span className={styles.count}>{unread}</span> : null}
      </button>
      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.head}>
            <h2>Notifications</h2>
            <button className={styles.mark} type="button" onClick={() => ops.markAllNotificationsRead()}>
              Mark all as read
            </button>
          </div>
          {notes.length === 0 ? (
            <p className={styles.empty}>No notifications.</p>
          ) : (
            <ul className={styles.list}>
              {notes.map((item) => (
                <li key={item.id}>
                  <button
                    className={item.read ? styles.item : `${styles.item} ${styles.unread}`}
                    type="button"
                    onClick={() => {
                      ops.markNotificationRead(item.id);
                      setOpen(false);
                      router.push(item.href || servicingCaseHref(item.caseId));
                    }}
                  >
                    <Avatar name={item.actor} size={36} />
                    <span className={styles.copy}>
                      <span className={styles.title}>{noticeTitle(item)}</span>
                      <span className={styles.body}>
                        <MentionText body={item.body} />
                      </span>
                      <span className={styles.time}>{noticeTime(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function noticeTitle(item: OpsNotification) {
  if (item.kind === "mention") return `${item.actor} mentioned you in a post`;
  if (item.kind === "cancellation") return "Pending cancellation";
  if (item.kind === "change") return "Change transaction updated";
  return `${item.actor} posted to your profile`;
}

function noticeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5a5 5 0 0 0-5 5v2.2c0 .7-.2 1.3-.6 1.9L3.2 13.4A1 1 0 0 0 4 15h12a1 1 0 0 0 .8-1.6l-1.2-1.8c-.4-.6-.6-1.2-.6-1.9V7.5a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
