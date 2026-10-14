"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DropdownItem, Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { OpsFile } from "@/components/ops/OpsFile";
import {
  CASE_CONTACTS,
  opportunitiesForContact,
  CASE_ORIGINS,
  CASE_PRIORITIES,
  CASE_QUEUES,
  CASE_REASONS,
  DISBURSEMENT_CASE_STATUSES,
  CASE_REQUEST_TYPES,
  CASE_SUB_QUEUES,
  picklist,
} from "@/lib/case-open";
import { servicingCaseHref, servicingHome } from "@/lib/loan-routes";
import { useOps } from "@/lib/ops-store";
import type { CasePriority } from "@/lib/ops-types";
import styles from "./open-case.module.css";

type LookupOption = { id: string; label: string; meta: string };

const PRIORITY_IDS: Record<string, CasePriority> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

export function OpenCase() {
  const router = useRouter();
  const ops = useOps();
  const [step, setStep] = useState<"management" | "servicing">("management");
  const [origin, setOrigin] = useState("");
  const [requestType, setRequestType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [queue, setQueue] = useState("");
  const [subQueue, setSubQueue] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [opportunity, setOpportunity] = useState("");
  const [priority, setPriority] = useState("");
  const [disbursementStatus, setDisbursementStatus] = useState("");
  const [due, setDue] = useState("");
  const showDisbursementStatus = reason === "Disbursement/Payoff";

  function open() {
    const id = ops.createCase({
      subject,
      details: description,
      priority: PRIORITY_IDS[priority] ?? "medium",
      origin,
      reason,
      contactName: contact,
      opportunity,
      queue,
      subQueue,
      requestType,
      projectDue: due,
      disbursementStatus: showDisbursementStatus ? disbursementStatus : "",
    });
    if (!id) return;
    const href = servicingCaseHref(id);
    window.setTimeout(() => router.push(href), 0);
  }

  return (
    <OpsFile
      flush
      backHref={servicingHome()}
      backLabel="Back to servicing cases"
      eyebrow="Servicing"
      title="Open Case"
    >
      {step === "management" ? (
        <section>
          <div className="uw-card-header">
            <h2 className="text-lg text-black">Case Management</h2>
          </div>
          <div className={styles.management}>
            <div className={styles.pair}>
              <Select label="Case Origin" aria-label="Case Origin" variant="float" value={origin} options={picklist(CASE_ORIGINS)} onChange={setOrigin} />
              <Select label="Type" aria-label="Type" variant="float" value={requestType} options={picklist(CASE_REQUEST_TYPES)} onChange={setRequestType} />
            </div>
            <FloatInput label="Subject" value={subject} onChange={setSubject} />
            <FloatInput label="Description" value={description} multiline onChange={setDescription} />
            <div className={styles.pair}>
              <Select label="Queue" aria-label="Queue" variant="float" value={queue} options={picklist(CASE_QUEUES)} onChange={setQueue} />
              <Select label="Sub Queue" aria-label="Sub Queue" variant="float" value={subQueue} options={picklist(CASE_SUB_QUEUES)} onChange={setSubQueue} />
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="uw-card-header">
            <h2 className="text-lg text-black">Servicing Case</h2>
          </div>
          <div className={styles.management}>
            <div className={styles.pair}>
              <Lookup
                label="Contact Name"
                value={contact}
                options={CASE_CONTACTS}
                onChange={(next) => {
                  setContact(next);
                  if (!opportunitiesForContact(next).some((item) => item.label === opportunity)) setOpportunity("");
                }}
              />
              <Lookup
                label="Opportunity"
                value={opportunity}
                options={opportunitiesForContact(contact)}
                emptyLabel={contact ? "No opportunities for this contact" : "Select a contact first"}
                onChange={setOpportunity}
              />
            </div>
            <div className={styles.pair}>
              <Select
                label="Case Reason"
                aria-label="Case Reason"
                variant="float"
                value={reason}
                options={picklist(CASE_REASONS)}
                onChange={(value) => {
                  setReason(value);
                  if (value !== "Disbursement/Payoff") setDisbursementStatus("");
                }}
              />
              <Select label="Priority" aria-label="Priority" variant="float" value={priority} options={picklist(CASE_PRIORITIES)} onChange={setPriority} />
            </div>
            <div className={styles.pair}>
              {showDisbursementStatus ? (
                <Select
                  label="Disbursement Case Status"
                  aria-label="Disbursement Case Status"
                  variant="float"
                  value={disbursementStatus}
                  options={picklist(DISBURSEMENT_CASE_STATUSES)}
                  onChange={setDisbursementStatus}
                />
              ) : (
                <span />
              )}
              <div className={due ? `${styles.date} ${styles.dateFilled}` : styles.date}>
                <FloatInput label="Project Due Date" type="date" value={due} onChange={setDue} />
              </div>
            </div>
          </div>
        </section>
      )}
      <div className={styles.actions}>
        {step === "servicing" ? (
          <Button variant="secondary" onClick={() => setStep("management")}>
            Previous
          </Button>
        ) : null}
        <Button onClick={() => (step === "management" ? setStep("servicing") : open())}>Next</Button>
      </div>
    </OpsFile>
  );
}

function Lookup({
  label,
  value,
  options,
  emptyLabel = "No matches",
  onChange,
}: {
  label: string;
  value: string;
  options: LookupOption[];
  emptyLabel?: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const needle = query.trim().toLowerCase();
  const filtering = needle.length > 0 && needle !== value.trim().toLowerCase();
  const matches = filtering
    ? options.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(needle))
    : options;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function place() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open, matches.length]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const node = event.target as Node;
      if (rootRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const timer = window.setTimeout(() => document.addEventListener("mousedown", onPointer), 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  function choose(item: LookupOption) {
    onChange(item.label);
    setQuery(item.label);
    setOpen(false);
  }

  return (
    <div className={styles.lookup} ref={rootRef} onMouseDown={() => setOpen(true)}>
      <FloatInput
        label={label}
        value={query}
        onChange={(next) => {
          setQuery(next);
          setActive(0);
          setOpen(true);
          if (value && next.trim().toLowerCase() !== value.trim().toLowerCase()) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault();
            choose(matches[active]);
          }
        }}
      />
      <img className={styles.lookupIcon} src="/dashboard/search.svg" alt="" />
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="uw-dropdown"
              role="listbox"
              aria-label={label}
              style={{ position: "fixed", top: box.top, left: box.left, width: Math.max(box.width, 280), maxHeight: 280, zIndex: 50 }}
            >
              {matches.length === 0 ? (
                <p className={styles.empty}>{emptyLabel}</p>
              ) : (
                <>
                  {filtering ? null : <p className={styles.recent}>Recent Items</p>}
                  {matches.map((item, index) => (
                    <DropdownItem
                      key={item.id}
                      role="option"
                      selected={item.label === value}
                      active={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(item)}
                    >
                      <span className={styles.choice}>
                        <span>{item.label}</span>
                        <span className={styles.meta}>{item.meta}</span>
                      </span>
                    </DropdownItem>
                  ))}
                </>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
