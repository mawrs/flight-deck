"use client";

import { Badge } from "@/components/Badge";
import { reviewCycleFor } from "@/lib/queues";
import type { Application } from "@/lib/types";
import { useViewLabels } from "@/lib/view-labels";

export function ReviewCycleBadge({ application }: { application: Application }) {
  const { labelFor } = useViewLabels();
  const label = labelFor(reviewCycleFor(application.status));

  return (
    <Badge tone="neutral" title={label}>
      {label}
    </Badge>
  );
}
