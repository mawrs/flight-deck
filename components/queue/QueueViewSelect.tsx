"use client";

import Link from "next/link";
import { QUEUE_VIEWS, type QueueViewId } from "@/lib/queues";
import { useViewLabels } from "@/lib/view-labels";
import { Dropdown } from "@/components/ui/Dropdown";

export function QueueViewSelect({ value }: { value: QueueViewId }) {
  const { labelFor } = useViewLabels();

  return (
    <Dropdown
      minWidth={480}
      panelClassName="min-w-[480px]"
      trigger={
        <button
          type="button"
          className="uw-view-select"
        >
          <span className="min-w-0 truncate">{labelFor(value)}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      }
    >
      {({ close }) =>
        QUEUE_VIEWS.map((view) => {
          const selected = view.id === value;
          return (
            <Link
              key={view.id}
              href={view.id === "pre-review" ? "/dashboard/loan-origination" : `/dashboard/loan-origination?view=${view.id}`}
              role="option"
              aria-selected={selected}
              onClick={close}
              className="uw-dropdown-item"
            >
              <span className="flex-1 whitespace-nowrap">{labelFor(view.id)}</span>
              <span className="flex size-5 shrink-0 items-center justify-center">
                {selected ? <CheckCircleIcon /> : null}
              </span>
            </Link>
          );
        })
      }
    </Dropdown>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.25 10C1.25 5.16797 5.16797 1.25 10 1.25C14.832 1.25 18.75 5.16797 18.75 10C18.75 14.832 14.832 18.75 10 18.75C5.16797 18.75 1.25 14.832 1.25 10ZM3.75 10L8.75 15L16.25 7.5L14.4922 5.74219L8.75 11.4844L5.50781 8.24219L3.75 10Z"
        fill="currentColor"
      />
    </svg>
  );
}
