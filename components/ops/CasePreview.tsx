"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export function CasePreview({
  href,
  subject,
  priority,
  status,
  caseNumber,
  description,
}: {
  href: string;
  subject: string;
  priority: string;
  status: string;
  caseNumber: string;
  description: string;
}) {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden" });

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function show(delay = 160) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  }

  function hide() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 120);
  }

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const card = cardRef.current;
    if (!trigger || !card) return;

    function place() {
      if (!trigger || !card) return;
      const anchor = trigger.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      const gap = 10;
      const margin = 8;
      let nextPlacement: "below" | "above" = "below";
      let top = anchor.bottom + gap;
      if (top + box.height > window.innerHeight - margin && anchor.top - gap - box.height >= margin) {
        top = anchor.top - gap - box.height;
        nextPlacement = "above";
      }
      let left = anchor.left;
      if (left + box.width > window.innerWidth - margin) left = window.innerWidth - box.width - margin;
      left = Math.max(margin, left);
      const arrow = Math.min(Math.max(16, anchor.left + Math.min(anchor.width, 48) / 2 - left), box.width - 20);
      setPlacement(nextPlacement);
      setStyle({
        position: "fixed",
        top,
        left,
        zIndex: 40,
        visibility: "visible",
        ["--arrow-left" as string]: `${arrow}px`,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <Link
        ref={triggerRef}
        href={href}
        className="uw-case-subject-trigger"
        aria-expanded={open}
        onMouseEnter={() => show()}
        onMouseLeave={hide}
        onFocus={() => show(0)}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        {subject}
      </Link>
      {open
        ? createPortal(
            <div
              ref={cardRef}
              className="uw-case-preview"
              style={style}
              data-placement={placement}
              role="dialog"
              aria-label={subject}
              onMouseEnter={() => show(0)}
              onMouseLeave={hide}
            >
              <p className="uw-case-preview-title">{subject}</p>
              <dl className="uw-case-preview-meta">
                <div>
                  <dt>Priority</dt>
                  <dd>{priority}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{status}</dd>
                </div>
                <div>
                  <dt>Case Number</dt>
                  <dd>{caseNumber}</dd>
                </div>
              </dl>
              <section className="uw-case-preview-section">
                <h3>Description</h3>
                <p>{description || "—"}</p>
              </section>
              <section className="uw-case-preview-section">
                <h3>Latest Update</h3>
                <p className="uw-case-preview-empty">No updates yet.</p>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
