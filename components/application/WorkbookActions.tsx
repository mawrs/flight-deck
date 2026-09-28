"use client";

import { buttonClassName } from "@/components/Button";
import { OpenWorkbookButton } from "@/components/workbook/OpenWorkbookButton";
import { shortDate } from "@/lib/format";
import type { Application } from "@/lib/types";

export function WorkbookActions({
  application,
  readOnly = false,
  onUploaded,
}: {
  application: Application;
  readOnly?: boolean;
  onUploaded: (fileName: string) => void;
}) {
  return (
    <div className="uw-card-pad space-y-sm">
      <h2 className="text-sm font-semibold text-navy">Completed workbook</h2>
      <p className="text-sm text-gray-medium">
        Open the master in a new window, make a copy, enter the LOS cross-check, then download XLS
        and PDF. Upload that completed sheet back here.
      </p>
      <div className="flex flex-wrap items-center gap-sm">
        <OpenWorkbookButton id={application.id} variant="button" />
        <label
          className={buttonClassName({
            variant: "outline",
            size: "small",
            className: readOnly ? "pointer-events-none opacity-50" : "cursor-pointer",
          })}
        >
          Upload completed workbook
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={readOnly}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploaded(file.name);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-gray-medium">
        {application.workbookFileName
          ? `Attached: ${application.workbookFileName}${
              application.workbookUploadedAt ? ` · ${shortDate(application.workbookUploadedAt)}` : ""
            }`
          : "No completed workbook attached yet."}
      </p>
    </div>
  );
}
