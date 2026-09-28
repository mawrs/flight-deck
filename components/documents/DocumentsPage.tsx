"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { StageIntro } from "@/components/application/StageIntro";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { Button } from "@/components/ui/Button";
import { sampleDocumentHref } from "@/lib/documents";
import { useApplication } from "@/lib/store";

export function DocumentsPage() {
  const { id, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [selected, setSelected] = useState<string[]>([]);
  if (!application) return null;

  const docs = application.documents;
  const selectedDocs = docs.filter((doc) => selected.includes(doc.id));

  function setDocuments(next: typeof docs) {
    updateApplication(id, { documents: next });
  }

  function deleteSelected() {
    setDocuments(docs.filter((doc) => !selected.includes(doc.id)));
    setSelected([]);
  }

  function markIncomplete() {
    const now = new Date().toISOString();
    setDocuments(
      docs.map((doc) =>
        selected.includes(doc.id)
          ? { ...doc, reviewStatus: "incomplete" as const, reviewedAt: now }
          : doc,
      ),
    );
  }

  function openSelected() {
    for (const doc of selectedDocs) {
      const link = document.createElement("a");
      link.href = sampleDocumentHref(doc.fileName);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.append(link);
      link.click();
      link.remove();
    }
  }

  return (
    <StageIntro
      title="Documents"
      action={
        selectedDocs.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-md">
            <p className="text-sm text-gray-dark">
              {selectedDocs.length} document(s) selected
            </p>
            <div className="flex items-center gap-xs">
              <Button variant="secondary" disabled={readOnly} onClick={deleteSelected}>
                Delete
              </Button>
              <Button variant="secondary" disabled={readOnly} onClick={markIncomplete}>
                Mark as Incomplete
              </Button>
              <Button onClick={openSelected}>Open Documents</Button>
            </div>
          </div>
        ) : null
      }
    >
      <DocumentsTable
        application={application}
        selected={selected}
        onSelectedChange={setSelected}
        readOnly={readOnly}
        onChange={setDocuments}
      />
    </StageIntro>
  );
}
