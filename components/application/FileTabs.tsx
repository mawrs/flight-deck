"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FILE_TABS, workflowSlugFromPath } from "@/lib/workflow";

export function FileTabs({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const current = workflowSlugFromPath(pathname);

  return (
    <nav className="w-full border-b border-gray-light bg-white" aria-label="File sections">
      <div className="flex gap-md overflow-x-auto px-xl pt-sm">
        {FILE_TABS.map((step) => {
          const active = step.slug === current;
          return (
            <Link
              key={step.slug}
              href={`${basePath}/${step.slug}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "-mb-px shrink-0 border-b-2 border-primary px-xs pb-[17px] pt-sm text-sm whitespace-nowrap text-primary"
                  : "-mb-px shrink-0 border-b-2 border-transparent px-xs pb-md pt-sm text-sm whitespace-nowrap text-gray-medium hover:text-primary"
              }
            >
              {step.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
