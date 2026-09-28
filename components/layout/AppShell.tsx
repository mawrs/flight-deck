"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileActions } from "@/components/application/FileActions";
import { StagePath } from "@/components/application/StagePath";
import { LOAN_HOME, fileRoute } from "@/lib/loan-routes";
import { useApplication } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const file = fileRoute(pathname);
  const workbook = pathname.includes("/workbook/");
  const workspace = Boolean(file || workbook);

  return (
    <div className={workspace ? "uw-shell uw-shell-workspace" : "uw-shell uw-shell-page"}>
      {file ? (
        <div className="uw-file-header">
          <FileHeader id={file.id} />
        </div>
      ) : null}
      {workspace ? (
        <div className="uw-workspace-scroll">{children}</div>
      ) : (
        <main className="uw-page-region">{children}</main>
      )}
    </div>
  );
}

function FileHeader({ id }: { id: string }) {
  const { application } = useApplication(id);

  if (!application) {
    return (
      <div className="uw-file-header-row">
        <span className="uw-muted-text">Loading file…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="uw-file-header-row">
        <Link
          href={LOAN_HOME}
          aria-label="Back to opportunities"
          className="uw-file-back group"
        >
          <span className="uw-file-back-icon">
            <BackIcon />
          </span>
          <div className="uw-file-title">
            <span>Opportunity</span>
            <p>
              {application.borrower.fullName} - {application.id}
            </p>
          </div>
        </Link>
        <FileActions id={id} />
      </div>
      <StagePath id={id} />
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
