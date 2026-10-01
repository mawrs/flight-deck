import Link from "next/link";
import type { ReactNode } from "react";

export function OpsFile({
  backHref,
  backLabel,
  eyebrow,
  title,
  actions,
  children,
}: {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="uw-file-header-row">
        <Link href={backHref} aria-label={backLabel} className="uw-file-back">
          <span className="uw-file-back-icon">
            <BackIcon />
          </span>
          <div className="uw-file-title">
            <span>{eyebrow}</span>
            <p>{title}</p>
          </div>
        </Link>
        {actions ? <div className="flex flex-wrap items-center justify-end gap-sm">{actions}</div> : null}
      </div>
      <div className="uw-workspace-scroll">
        <div className="uw-workspace-content flex flex-col gap-lg">{children}</div>
      </div>
    </div>
  );
}

export function OpsCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="uw-card">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">{title}</h2>
        {action}
      </div>
      <div className="p-lg">{children}</div>
    </section>
  );
}

export function FactList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex min-w-60 flex-1 flex-col gap-md">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-xs">
          <dt className="text-xs text-gray-medium">{item.label}</dt>
          <dd className="text-sm text-black">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OpsMissing({ message, href, label }: { message: string; href: string; label: string }) {
  return (
    <div className="uw-page-status flex flex-col items-center gap-md">
      <p>{message}</p>
      <Link href={href} className="text-sm text-primary">
        {label}
      </Link>
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
