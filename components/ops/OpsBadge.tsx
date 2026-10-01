import { StatusBadge } from "@/components/shared/StatusBadge";
import { opsLabel } from "@/lib/ops-logic";

export function OpsBadge({ value }: { value: string }) {
  return <StatusBadge value={value} label={opsLabel(value)} />;
}
