"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import {
  OFFER_TERMS,
  offerTotals,
  paymentFor,
  type RateKind,
  type RateProduct,
  type RateTerm,
} from "@/lib/calculations/rates";
import { money } from "@/lib/format";
import type { Application } from "@/lib/types";

export function RateOffers({
  application,
  product,
}: {
  application: Application;
  product: RateProduct;
}) {
  const twoCols = product !== "fixed";

  return (
    <section className="bg-white">
      <div className={`grid items-start ${twoCols ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        <DetailGroup
          title="Fixed"
          kind="Fixed"
          product={product}
          application={application}
          divided={twoCols}
        />
        {twoCols ? (
          <DetailGroup
            title="Variable"
            kind="Variable"
            product={product}
            application={application}
          />
        ) : null}
      </div>
    </section>
  );
}

function DetailGroup({
  title,
  kind,
  product,
  application,
  divided = false,
}: {
  title: string;
  kind: RateKind;
  product: RateProduct;
  application: Application;
  divided?: boolean;
}) {
  return (
    <div className={`min-w-0 ${divided ? "lg:border-r lg:border-gray-light" : ""}`}>
      <div className="uw-card-header">
        <h2 className="text-lg text-black">{title}</h2>
      </div>
      <div className="flex flex-col gap-sm p-md">
        {OFFER_TERMS.map((term) => (
          <DetailRow
            key={`${kind}-${term.months}`}
            kind={kind}
            term={term}
            product={product}
            application={application}
          />
        ))}
      </div>
    </div>
  );
}

function DetailRow({
  kind,
  term,
  product,
  application,
}: {
  kind: RateKind;
  term: (typeof OFFER_TERMS)[number];
  product: RateProduct;
  application: Application;
}) {
  const selected =
    application.requestedRateType === kind && application.requestedTerm === term.months;
  const [open, setOpen] = useState(false);
  const fullPayment = paymentFor(application, kind, term.months as RateTerm, "immediate");
  const currentPayment = paymentFor(application, kind, term.months as RateTerm, product);
  const { total, interest } = offerTotals(fullPayment, term.months, application.amount);
  const inSchool =
    product === "deferred" ? 25 : product === "interest-only" ? currentPayment : fullPayment;
  const afterSchool = fullPayment;

  return (
    <div
      className={`flex flex-col gap-[10px] rounded-xs border bg-white px-md pt-md pb-sm ${
        selected ? "border-success" : "border-gray-light"
      }`}
    >
      <div className="flex items-center gap-xl">
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <p className="text-base font-semibold text-black">{term.years} years</p>
          <p className="text-xs text-gray-dark">{term.months} monthly payments</p>
        </div>
        <div className="flex shrink-0 items-center gap-xl">
          <Metric
            label="Total Repayments"
            value={total == null ? "—" : moneyWhole(total)}
            hint={interest == null ? "" : `Includes ${moneyWhole(interest)} in interest`}
          />
        </div>
      </div>
      <div className="flex flex-col gap-sm border-t border-gray-light py-xs">
        <Button
          variant="text"
          size="small"
          onClick={() => setOpen((next) => !next)}
          aria-expanded={open}
        >
          {open ? "Hide payment details" : "See payment details"}
          <ChevronIcon open={open} />
        </Button>
        {open ? (
          <div className="flex h-[88px] items-center gap-xl rounded-xs border border-gray-light bg-gray-lightest p-md">
            <Detail
              label="First payment while in school"
              value={money(inSchool ?? 25)}
              hint={`Starts ${monthYear(inSchoolStart(application))}`}
            />
            <Detail
              label="First full payment after school"
              value={afterSchool == null ? "—" : money(afterSchool)}
              hint={monthYear(afterSchoolDate(application))}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col items-end justify-center gap-xs text-right whitespace-nowrap">
      <p className="text-[11px] leading-[13px] text-gray-dark">{label}</p>
      <p className="text-[15px] font-semibold text-black">{value}</p>
      {hint ? <p className="text-[11px] leading-[13px] text-gray-dark">{hint}</p> : null}
    </div>
  );
}

function Detail({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col justify-center gap-xs whitespace-nowrap">
      <p className="text-[11px] leading-[13px] text-gray-dark">{label}</p>
      <p className="text-[15px] font-semibold text-black">{value}</p>
      <p className="text-[11px] leading-[13px] text-gray-dark">{hint}</p>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={open ? "rotate-180" : ""}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function moneyWhole(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function inSchoolStart(application: Application) {
  const date = new Date(application.applicationDate);
  if (Number.isNaN(date.getTime())) return new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

function afterSchoolDate(application: Application) {
  const year = Number(application.borrower.graduationYear);
  if (year > new Date().getFullYear()) return new Date(year, 4, 1);
  const date = inSchoolStart(application);
  date.setFullYear(date.getFullYear() + 6);
  return date;
}

function monthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
