"use client";

import { useFileWorkspace } from "@/components/application/file-context";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useApplication } from "@/lib/store";

export function NotesPage() {
  const { id, mode, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  if (!application) return null;

  const notesLocked =
    application.status === "approved" ||
    (mode === "primary" && readOnly);

  return (
    <div className="bg-white">
      <NotesPanel
        application={application}
        readOnly={notesLocked}
        onChange={(notes) => updateApplication(id, { notes })}
      />
    </div>
  );
}
