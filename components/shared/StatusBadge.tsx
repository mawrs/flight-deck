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
  ReFi: "navy",
  EdMed: "orange",
  Tavant: "navy",
  requested: "warning",
  certified: "success",
  reduced: "orange",
  scheduled: "navy",
  disbursed: "success",
  high: "error",
  medium: "warning",
  low: "neutral",
  none: "neutral",
  new: "info",
  open: "info",
  review: "warning",
  "on-hold": "warning",
  "awaiting-information": "orange",
  "pending-servicer": "navy",
  "pending-seb-loan-ops": "navy",
  closed: "success",
  completed: "success",
  "In-School": "info",
};

export function StatusBadge({
  value,
  label,
}: {
  value: WorkflowStatus | DocumentStatus | string;
  label?: string;
}) {
  return <Badge tone={statusTone[value] ?? "neutral"}>{label ?? value.replace(/-/g, " ")}</Badge>;
}
