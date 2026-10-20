"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { missingSendRequirements } from "@/lib/account-opening-data";
import { sendOpeningLink, useAccountOpening } from "@/lib/account-opening-store";

const QUEUE = "/dashboard/loan-origination/account-opening";

export function AccountOpeningHeader({ id }: { id: string }) {
  const opening = useAccountOpening(id);
  const isNew = id === "new";
  const name = isNew ? "New account" : opening?.fields.fullName.value || id;
  const missing = opening ? missingSendRequirements(opening) : [];
  const sent = opening ? opening.handoff !== "not-sent" : false;
  const branch = opening?.channel === "branch-event";

  return (
    <div className="uw-file-header-row">
      <Link href={QUEUE} aria-label="Back to account openings" className="uw-file-back group">
        <span className="uw-file-back-icon">
          <BackIcon />
        </span>
        <div className="uw-file-title">
          <span>Account Opening</span>
          <p>
            {name}
            {isNew ? "" : ` - ${id}`}
          </p>
        </div>
      </Link>
      {opening ? (
        <div className="flex shrink-0 items-center gap-sm">
          <Button
            variant="secondary"
            disabled={!sent}
            onClick={() => {
              window.open(`/account-opening/customer/${opening.id}`, "_blank", "noopener,noreferrer");
            }}
          >
            Customer POV
          </Button>
          {opening.status === "opened" ? null : (
            <Button disabled={missing.length > 0 || sent} onClick={() => sendOpeningLink(opening.id)}>
              {sent
                ? branch
                  ? "Application handed over"
                  : "Application sent"
                : branch
                  ? "Hand them the application"
                  : "Send application"}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
