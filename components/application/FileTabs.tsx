"use client";

import { usePathname } from "next/navigation";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { FILE_TABS, workflowSlugFromPath } from "@/lib/workflow";

export function FileTabs({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const current = workflowSlugFromPath(pathname);

  return (
    <SectionTabs
      label="File sections"
      current={current}
      tabs={FILE_TABS.map((step) => ({
        id: step.slug,
        label: step.label,
        href: `${basePath}/${step.slug}`,
      }))}
    />
  );
}
