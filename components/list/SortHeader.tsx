import type { SortDirection } from "@/lib/list-sort";

export function SortHeader({
  label,
  active,
  direction,
  onSort,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
}) {
  return (
    <th className="uw-list-th" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={`uw-sort ${active ? "text-primary" : ""}`}
        aria-label={active ? `${label}, sorted ${direction === "asc" ? "ascending" : "descending"}` : `Sort by ${label}`}
        onClick={onSort}
      >
        <span className="min-w-0 truncate">{label}</span>
        <SortIcon active={active} direction={direction} />
      </button>
    </th>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-gray-medium">
        <path d="M3 4.5 6 2l3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 7.5 6 10l3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
      {direction === "asc" ? (
        <path d="M2.5 7.5 6 3.5l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2.5 4.5 6 8.5l3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
