import { Badge, type BadgeTone } from "@/components/Badge";
import type { DocumentStatus, WorkflowStatus } from "@/lib/types";

const statusTone: Record<string, BadgeTone> = {
  "pre-review": "warning",
  "needs-docs": "warning",
  "senior-review": "navy",
  returned: "orange",
  approved: "success",
  pending: "neutral",
  submitted: "warning",
  rejected: "error",
  incomplete: "error",
  Medium: "neutral",
  Hard: "error",
  InSchool: "info",
  Tavant: "navy",
};

export function StatusBadge({
  value,
}: {
  value: WorkflowStatus | DocumentStatus | string;
}) {
  return <Badge tone={statusTone[value] ?? "neutral"}>{value.replace(/-/g, " ")}</Badge>;
}
