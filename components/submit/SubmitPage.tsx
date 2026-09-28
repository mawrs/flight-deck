"use client";

import { useFileWorkspace } from "@/components/application/file-context";
import { SubmitPanel } from "@/components/submit/SubmitPanel";
import { useApplication } from "@/lib/store";

export function SubmitPage() {
  const { id } = useFileWorkspace();
  const { application } = useApplication(id);
  if (!application) return null;
  return <SubmitPanel application={application} />;
}
