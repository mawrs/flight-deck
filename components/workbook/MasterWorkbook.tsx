"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Dropdown";
import { useApplication } from "@/lib/store";
import {
  MASTER_SHEETS,
  computedValue,
  displayValue,
  downloadWorkbookPdf,
  downloadWorkbookXlsx,
  emptyWorkbookValues,
  type WorkbookField,
  type WorkbookValues,
} from "@/lib/workbook/master";

export function MasterWorkbook({ id }: { id: string }) {
  const { application, updateApplication } = useApplication(id);
  const [sheetId, setSheetId] = useState(MASTER_SHEETS[0].id);

  if (!application) {
    return <p className="p-lg text-sm text-gray-medium">Application {id} was not found.</p>;
  }
  const file = application;

  const copied = file.workbookCopy != null;
  const values = file.workbookCopy ?? emptyWorkbookValues();
  const editable = copied;
  const sheet = MASTER_SHEETS.find((item) => item.id === sheetId) ?? MASTER_SHEETS[0];

  function setValues(next: WorkbookValues) {
    updateApplication(id, { workbookCopy: next });
  }

  function makeCopy() {
    const next = { ...emptyWorkbookValues(), loanId: id };
    updateApplication(id, { workbookCopy: next });
    downloadWorkbookXlsx(next, id, true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-lightest">
      <div className="flex flex-wrap items-center justify-between gap-md border-b border-gray-light bg-white px-xl py-sm">
        <div>
          <p className="text-sm font-semibold text-black">
            {copied ? "Working copy" : "Master workbook"}
            <span className="ml-sm font-normal text-gray-medium">· {id}</span>
          </p>
          <p className="text-xs text-gray-medium">
            {copied
              ? "Enter LOS values here. Download XLS and PDF, then upload the completed file on Completion."
              : "Read-only master. Make a copy before entering file data."}
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          {copied ? null : (
            <Button onClick={makeCopy}>
              Make a copy
            </Button>
          )}
          <Button variant="secondary" onClick={() => downloadWorkbookXlsx(values, id, copied)}>
            Download XLS
          </Button>
          <Button variant="secondary" onClick={() => downloadWorkbookPdf(values, id, copied)}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-md">
        <table className="min-w-full border-collapse bg-white text-sm">
          <thead>
            <tr>
              <th className="w-10 border border-gray-light bg-gray-extra-light px-xs py-xs text-xs font-semibold text-gray-medium" />
              {sheet.columns.map((column) => (
                <th
                  key={column}
                  className="border border-gray-light bg-gray-extra-light px-sm py-xs text-xs font-semibold text-gray-dark"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border border-gray-light bg-gray-extra-light px-xs py-xs text-center text-xs text-gray-medium">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-gray-light p-0 align-top">
                    <SheetCell
                      cell={cell}
                      values={values}
                      editable={editable}
                      onChange={(fieldId, value) => setValues({ ...values, [fieldId]: value })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-xs border-t border-gray-light bg-white px-md pt-xs">
        {MASTER_SHEETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSheetId(item.id)}
            className={
              item.id === sheet.id
                ? "-mb-px border border-b-white border-gray-light bg-white px-md py-sm text-sm text-black"
                : "px-md py-sm text-sm text-gray-medium hover:text-primary"
            }
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SheetCell({
  cell,
  values,
  editable,
  onChange,
}: {
  cell: (typeof MASTER_SHEETS)[number]["rows"][number][number];
  values: WorkbookValues;
  editable: boolean;
  onChange: (id: string, value: string) => void;
}) {
  if (cell.kind === "empty") return <span className="block min-h-[34px]" />;
  if (cell.kind === "title") {
    return <p className="px-sm py-xs text-sm font-semibold text-black">{cell.text}</p>;
  }
  if (cell.kind === "note") {
    return <p className="px-sm py-xs text-xs text-gray-medium">{cell.text}</p>;
  }
  if (cell.kind === "label") {
    return (
      <p className={`px-sm py-xs text-sm ${cell.strong ? "font-semibold text-black" : "text-gray-dark"}`}>
        {cell.text}
      </p>
    );
  }
  return (
    <FieldInput field={cell.field} values={values} editable={editable} onChange={onChange} />
  );
}

function FieldInput({
  field,
  values,
  editable,
  onChange,
}: {
  field: WorkbookField;
  values: WorkbookValues;
  editable: boolean;
  onChange: (id: string, value: string) => void;
}) {
  if (field.kind === "computed") {
    return (
      <p className="min-h-[34px] bg-primary-bg px-sm py-xs text-sm text-black">
        {computedValue(field.id, values) || "—"}
      </p>
    );
  }

  if (!editable) {
    return (
      <p className="min-h-[34px] bg-gray-extra-light px-sm py-xs text-sm text-gray-medium">
        {displayValue(field, values) || "—"}
      </p>
    );
  }

  if (field.kind === "select") {
    return (
      <Select
        variant="compact"
        value={values[field.id] ?? field.options?.[0] ?? ""}
        options={field.options ?? []}
        onChange={(next) => onChange(field.id, next)}
      />
    );
  }

  return (
    <input
      className="h-[34px] w-full bg-white px-sm text-sm outline-none"
      value={values[field.id] ?? ""}
      onChange={(event) => onChange(field.id, event.target.value)}
    />
  );
}
