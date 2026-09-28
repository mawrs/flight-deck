"use client";

import { FileTabs } from "@/components/application/FileTabs";
import {
  FileWorkspaceContext,
  type FileMode,
  type FileWorkspaceValue,
} from "@/components/application/file-context";
import { useApplication } from "@/lib/store";

export type { FileMode };
export { useFileWorkspace } from "@/components/application/file-context";

export function FileWorkspace({
  id,
  mode,
  children,
}: {
  id: string;
  mode: FileMode;
  children: React.ReactNode;
}) {
  const { application, ready } = useApplication(id);

  if (!ready) {
    return <p className="p-md text-sm text-gray-medium">Loading application…</p>;
  }
  if (!application) {
    return <p className="p-md text-sm text-gray-medium">Application {id} was not found.</p>;
  }

  const readOnly =
    mode === "senior"
      ? application.status !== "senior-review"
      : application.status === "senior-review" || application.status === "approved";

  const value: FileWorkspaceValue = {
    id,
    mode,
    basePath: mode === "senior" ? `/dashboard/loan-origination/senior/${id}` : `/dashboard/loan-origination/applications/${id}`,
    readOnly,
  };

  return (
    <FileWorkspaceContext.Provider value={value}>
      <div className="flex flex-col bg-white">
        {application.status === "returned" && application.seniorNotes ? (
          <div className="border-b border-orange bg-orange-bg px-xl py-sm text-sm text-orange-hover">
            Returned by senior: {application.seniorNotes}
          </div>
        ) : null}
        <FileTabs basePath={value.basePath} />
        {children}
      </div>
    </FileWorkspaceContext.Provider>
  );
}
