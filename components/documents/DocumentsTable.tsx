"use client";

import type { MouseEvent } from "react";
import { Select } from "@/components/ui/Dropdown";
import { sampleDocumentHref } from "@/lib/documents";
import { estDateTime, titleCase } from "@/lib/format";
import type { Application, DocumentStatus, UploadedDocument } from "@/lib/types";

const STATUSES: DocumentStatus[] = [
  "pending",
  "submitted",
  "approved",
  "rejected",
  "incomplete",
];

function statusLabel(doc: UploadedDocument) {
  if (doc.reviewStatus === "pending") return doc.sourceStatus;
  return titleCase(doc.reviewStatus);
}

export function DocumentsTable({
  application,
  selected,
  onSelectedChange,
  onChange,
  readOnly = false,
}: {
  application: Application;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  onChange: (next: Application["documents"]) => void;
  readOnly?: boolean;
}) {
  const docs = application.documents;
  const allSelected = docs.length > 0 && selected.length === docs.length;

  function toggle(id: string) {
    onSelectedChange(
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
    );
  }

  function toggleAll() {
    onSelectedChange(allSelected ? [] : docs.map((doc) => doc.id));
  }

  function update(id: string, patch: Partial<UploadedDocument>) {
    onChange(
      docs.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              ...patch,
              reviewedAt:
                patch.reviewStatus && patch.reviewStatus !== "pending"
                  ? new Date().toISOString()
                  : patch.reviewStatus === "pending"
                    ? null
                    : doc.reviewedAt,
            }
          : doc,
      ),
    );
  }

  function onRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, select, input, label")) return;
    toggle(id);
  }

  return (
    <div className="overflow-x-auto">
      <table className="uw-data-table min-w-[1400px] table-fixed">
        <thead>
          <tr>
            <th className="uw-list-th w-14">
              <CheckBox checked={allSelected} onChange={toggleAll} label="Select all documents" />
            </th>
            <th className="uw-list-th w-[240px]">Document Name</th>
            <th className="uw-list-th w-[220px]">Document Type</th>
            <th className="uw-list-th">Description</th>
            <th className="uw-list-th w-[260px]">Doc Uploaded</th>
            <th className="uw-list-th w-[160px]">Doc Uploaded (EST)</th>
            <th className="uw-list-th w-[170px]">Date Reviewed (EST)</th>
            <th className="uw-list-th w-[120px]">Status</th>
            <th className="uw-list-th w-[97px]">Internal</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const checked = selected.includes(doc.id);
            return (
              <tr
                key={doc.id}
                className={`cursor-pointer align-middle ${checked ? "bg-gray-lightest" : "hover:bg-gray-extra-light"}`}
                onClick={(event) => onRowClick(event, doc.id)}
              >
                <td className="uw-list-td w-px">
                  <CheckBox
                    checked={checked}
                    onChange={() => toggle(doc.id)}
                    label={`Select ${doc.name}`}
                  />
                </td>
                <td className="uw-list-td uw-list-td-wrap">{doc.name}</td>
                <td className="uw-list-td uw-list-td-wrap">{doc.typeLabel}</td>
                <td className="uw-list-td uw-list-td-wrap">{doc.description}</td>
                <td className="uw-list-td uw-list-td-wrap">
                  <span>
                    <a
                      href={sampleDocumentHref(doc.fileName)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      {doc.fileName}
                    </a>
                  </span>
                </td>
                <td className="uw-list-td">{estDateTime(doc.uploadedAt)}</td>
                <td className="uw-list-td">{estDateTime(doc.reviewedAt)}</td>
                <td className="uw-list-td">
                  {readOnly ? (
                    statusLabel(doc)
                  ) : (
                    <Select
                      variant="plain"
                      value={doc.reviewStatus}
                      aria-label={`${doc.name} status`}
                      options={STATUSES.map((status) => ({
                        id: status,
                        label: status === "pending" ? doc.sourceStatus : titleCase(status),
                      }))}
                      onChange={(reviewStatus) =>
                        update(doc.id, {
                          reviewStatus: reviewStatus as DocumentStatus,
                        })
                      }
                    />
                  )}
                </td>
                <td className="uw-list-td">{doc.internal ? "Y" : "N"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CheckBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex size-7 shrink-0 items-center justify-center ${
        checked ? "text-primary" : "text-gray-dark"
      }`}
    >
      <span
        className={`flex size-5 items-center justify-center rounded-[2px] border ${
          checked ? "border-primary bg-primary text-white" : "border-gray-dark bg-white"
        }`}
      >
        {checked ? <CheckIcon /> : null}
      </span>
    </button>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2l2.4 2.4 4.6-5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
