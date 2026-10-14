"use client";

import Link from "next/link";

const ACTIVE =
  "-mb-px shrink-0 border-b-2 border-primary px-xs pb-[17px] pt-sm text-sm whitespace-nowrap text-primary";
const IDLE =
  "-mb-px shrink-0 border-b-2 border-transparent px-xs pb-md pt-sm text-sm whitespace-nowrap text-gray-medium hover:text-primary";

export function SectionTabs({
  label,
  current,
  tabs,
  onSelect,
}: {
  label: string;
  current: string;
  tabs: { id: string; label: string; href?: string }[];
  onSelect?: (id: string) => void;
}) {
  return (
    <nav className="w-full shrink-0 border-b border-gray-light bg-white" aria-label={label}>
      <div className="flex gap-md overflow-x-auto px-xl pt-sm">
        {tabs.map((tab) => {
          const active = tab.id === current;
          const className = active ? ACTIVE : IDLE;
          if (tab.href) {
            return (
              <Link key={tab.id} href={tab.href} aria-current={active ? "page" : undefined} className={className}>
                {tab.label}
              </Link>
            );
          }
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              className={className}
              onClick={() => onSelect?.(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
