"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFileWorkspace } from "@/components/application/file-context";
import { buttonClass } from "@/components/ui/Button";
import { stepIndex, WORKFLOW_STEPS, workflowSlugFromPath } from "@/lib/workflow";

export function StepFooter() {
  const pathname = usePathname();
  const { basePath } = useFileWorkspace();
  const current = workflowSlugFromPath(pathname);
  const index = stepIndex(current);
  const next = index < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[index + 1] : null;

  return (
    <div className="sticky bottom-0 flex justify-end border-t border-gray-light bg-white px-2xl py-sm">
      {next ? (
        <Link href={`${basePath}/${next.slug}`} className={buttonClass("primary")}>
          Continue
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
