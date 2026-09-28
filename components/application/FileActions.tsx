"use client";

import { useState } from "react";
import { FileReviewModal } from "@/components/application/FileReviewModal";
import { NotesModal } from "@/components/application/NotesModal";
import { Button } from "@/components/ui/Button";
import { isSupervisorStage, stageIndexFor } from "@/lib/stages";
import { useApplication, useStore } from "@/lib/store";

export function FileActions({ id }: { id: string }) {
  const { application } = useApplication(id);
  const { updateApplication } = useStore();
  const [notesOpen, setNotesOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!application) return null;

  const canFileReview = isSupervisorStage(stageIndexFor(application));

  return (
    <div className="flex shrink-0 items-center gap-sm">
      <Button variant="secondary" onClick={() => setNotesOpen(true)}>
        Notes
      </Button>
      <NotesModal
        open={notesOpen}
        value={application.fileNotes}
        updatedAt={application.fileNotesUpdatedAt}
        onChange={(fileNotes, touch) =>
          updateApplication(id, {
            fileNotes,
            ...(touch ? { fileNotesUpdatedAt: new Date().toISOString() } : {}),
          })
        }
        onClose={() => setNotesOpen(false)}
      />
      <Button disabled={!canFileReview} onClick={() => setReviewOpen(true)}>
        File Review
      </Button>
      <FileReviewModal
        open={reviewOpen}
        application={application}
        onSave={(fileReview) => updateApplication(id, { fileReview })}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
