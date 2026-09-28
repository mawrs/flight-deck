"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { calculate } from "@/lib/calculations";
import { estDateTime } from "@/lib/format";
import type { Application, ApplicationPatch } from "@/lib/types";

const BORROWER_STATUSES = [
  "Lead",
  "Application Not Complete",
  "Awaiting CoSigner Completion",
  "UW - PreReview",
  "In Underwriting",
];

const UNDERWRITERS = [
  "Dana Whitfield",
  "Dustin Pennington",
  "Harper Quinn",
  "June Calder",
  "Miles Crowe",
  "Owen Briggs",
  "Ravi Mehra",
  "Sasha Lind",
];

function moneySpaced(value: number) {
  return `$ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function addMinutes(iso: string, minutes: number) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function docAt(application: Application, kind: Application["documents"][number]["kind"]) {
  return application.documents.find((item) => item.kind === kind)?.uploadedAt ?? application.hardCreditDate;
}

const CARD = "flex flex-col gap-md rounded-xs border border-gray-light bg-white px-xl py-lg";

export function BorrowerInformation({
  application,
  basePath,
  onChange,
}: {
  application: Application;
  basePath: string;
  readOnly?: boolean;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const calc = calculate(application);
  const extras = application.underwriting;
  const mlaAt = docAt(application, "mla");
  const identityAt = docAt(application, "identity");
  const payStubAt = docAt(application, "pay-stub");
  const preTax = application.borrower.statedAnnualIncome / 12;
  const postTax = preTax * 0.5178;
  const mortgagePayment = application.debtTrades
    .filter((trade) => /mortgage|housing/i.test(trade.category) && trade.includeInDti)
    .reduce((sum, trade) => sum + (trade.payment || 0), 0);
  const lowestMortgage =
    mortgagePayment > 0 && calc.housingPayment > 0
      ? Math.min(mortgagePayment, calc.housingPayment)
      : 0;
  const [fields, setFields] = useState({
    incomeMonthly: moneySpaced(calc.monthlyBaseIncome),
    otherIncome: moneySpaced(calc.monthlyVariableIncome),
    totalIncome: moneySpaced(calc.monthlyIncome),
    liabilities: moneySpaced(calc.remainingMonthlyDebt),
    otherLiabilities: moneySpaced(0),
    housing: moneySpaced(calc.housingPayment),
    lowestMortgage: moneySpaced(lowestMortgage),
    fico: String(application.borrower.fico || ""),
    preTax: moneySpaced(preTax),
    postTax: moneySpaced(postTax),
  });

  function setField(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (key === "fico") {
      onChange({ borrower: { ...application.borrower, fico: Number(value.replace(/\D/g, "")) || 0 } });
    }
  }

  const statusRows = [
    { at: application.preReviewAt, status: extras.borrowerStatus },
    { at: application.preReviewAt, status: extras.borrowerStatus },
    { at: addMinutes(application.applicationDate, 1), status: "Application Not Complete" },
    { at: application.applicationDate, status: "Lead" },
  ];

  function patchExtras(next: Partial<Application["underwriting"]>) {
    onChange({ underwriting: { ...extras, ...next } });
  }

  return (
    <div className="flex flex-col gap-lg bg-white px-xl py-lg">
      <section className={CARD}>
        <h2 className="text-base font-semibold text-black">Income Information</h2>
        <div className="grid grid-cols-4 gap-sm">
          <FloatInput
            label="Income (Monthly)"
            value={fields.incomeMonthly}
            onChange={(value) => setField("incomeMonthly", value)}
          />
          <FloatInput
            label="Other Income (Monthly)"
            value={fields.otherIncome}
            onChange={(value) => setField("otherIncome", value)}
          />
          <FloatInput
            label="Total Income (Monthly)"
            value={fields.totalIncome}
            onChange={(value) => setField("totalIncome", value)}
          />
          <div />
        </div>
      </section>

      <section className={CARD}>
        <h2 className="text-base font-semibold text-black">Liabilities Information</h2>
        <div className="flex flex-col gap-xs">
          <div className="grid grid-cols-4 gap-sm">
            <FloatInput
              label="Liabilities (Monthly)"
              value={fields.liabilities}
              onChange={(value) => setField("liabilities", value)}
            />
            <FloatInput
              label="Liabilities (Monthly)"
              value={fields.otherLiabilities}
              onChange={(value) => setField("otherLiabilities", value)}
            />
            <FloatInput
              label="Housing Expense (Monthly)"
              value={fields.housing}
              onChange={(value) => setField("housing", value)}
            />
            <FloatInput
              label="Lowest Of Mortgage Lien And Housing Expense"
              value={fields.lowestMortgage}
              onChange={(value) => setField("lowestMortgage", value)}
            />
          </div>
          <div className="grid grid-cols-4 gap-sm">
            <FloatInput
              label="FICO Score"
              value={fields.fico}
              onChange={(value) => setField("fico", value)}
            />
            <FloatInput
              label="Pre Tax"
              value={fields.preTax}
              onChange={(value) => setField("preTax", value)}
            />
            <FloatInput
              label="Post Tax"
              value={fields.postTax}
              onChange={(value) => setField("postTax", value)}
            />
            <div />
          </div>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="text-base font-semibold text-black">Status Information</h2>
        <div className="overflow-hidden rounded-xs border border-gray-light">
          <table className="uw-data-table">
            <thead className="bg-gray-lightest">
              <tr>
                <th className="w-[250px] border-b border-gray-light px-xl py-3 font-semibold text-black">
                  Date (EST)
                </th>
                <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map((row, index) => (
                <tr key={`${row.status}-${index}`}>
                  <td className="w-[250px] border-b border-gray-light px-xl py-md whitespace-nowrap text-gray-dark">
                    {estDateTime(row.at)}
                  </td>
                  <td className="border-b border-gray-light px-xl py-md text-gray-dark">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="text-base font-semibold text-black">Borrower MLA Eligibility Status</h2>
        <div className="overflow-hidden rounded-xs border border-gray-light">
          <table className="uw-data-table">
            <thead className="bg-gray-lightest">
              <tr>
                <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">
                  Date Sent (EST)
                </th>
                <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">
                  Date Received (EST)
                </th>
                <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-gray-light px-xl py-md whitespace-nowrap text-gray-dark">
                  {estDateTime(mlaAt)}
                </td>
                <td className="border-b border-gray-light px-xl py-md whitespace-nowrap text-gray-dark">
                  {estDateTime(mlaAt)}
                </td>
                <td className="border-b border-gray-light px-xl py-md text-gray-dark">N</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link href={`${basePath}/documents`} className="uw-btn-link">
          View MLA PDF V1
        </Link>
      </section>

      <section className={CARD}>
        <FloatSelect
          label="Select Status"
          heading="Borrower Status"
          value={extras.borrowerStatus}
          options={BORROWER_STATUSES}
          onChange={(borrowerStatus) => patchExtras({ borrowerStatus })}
        />
        <FloatSelect
          label="Select Underwriter"
          heading="UnderWriter Name"
          value={application.underwriter}
          options={
            UNDERWRITERS.includes(application.underwriter)
              ? UNDERWRITERS
              : [application.underwriter, ...UNDERWRITERS]
          }
          onChange={(underwriter) => onChange({ underwriter })}
        />
        <Link href={`${basePath}/documents`} className="uw-btn-link">
          View Credit Report
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-md">
          <label className="flex h-7 items-center gap-3 text-base text-black">
            <input
              type="checkbox"
              checked={extras.supervisorApproval}
              onChange={(event) => patchExtras({ supervisorApproval: event.target.checked })}
              className="size-7 rounded-xs border-gray-light text-primary accent-primary"
            />
            Supervisor Approval
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base text-black">Eligible under MLA(Borrower)</p>
            <label className="flex items-center gap-sm text-base text-black">
              <input
                type="radio"
                name="mla-eligible"
                checked={extras.mlaEligible === "yes"}
                onChange={() => patchExtras({ mlaEligible: "yes" })}
                className="size-6 accent-primary"
              />
              Yes
            </label>
            <label className="flex items-center gap-sm text-base text-black">
              <input
                type="radio"
                name="mla-eligible"
                checked={extras.mlaEligible === "no"}
                onChange={() => patchExtras({ mlaEligible: "no" })}
                className="size-6 accent-primary"
              />
              No
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="w-fit">Fetch MLA for Borrower</Button>
        </div>
      </section>

      <VerificationBlock
        title="Digital Identity Verification"
        sentAt={identityAt}
        receivedAt={identityAt}
        pdfLabel="View DIT PDF V1"
        href={`${basePath}/documents`}
      >
        <Button className="w-fit">Verify ID</Button>
      </VerificationBlock>

      <VerificationBlock
        title="Employment Information"
        sentAt={payStubAt}
        receivedAt={payStubAt}
        pdfLabel="View DIT PDF V1"
        href={`${basePath}/documents`}
      >
        <div className="flex flex-wrap gap-xl">
          <span className="flex items-center gap-sm">
            <Button className="w-fit">Verify CURRENT Employment</Button>
            <InfoTip text="Confirms the borrower's current employer only." />
          </span>
          <span className="flex items-center gap-sm">
            <Button className="w-fit">Verify FULL Employment</Button>
            <InfoTip text="Confirms the borrower's full employment history." />
          </span>
        </div>
      </VerificationBlock>
    </div>
  );
}

function FloatSelect({
  heading,
  label,
  value,
  options,
  onChange,
}: {
  heading: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-md">
      <p className="text-base font-semibold text-black">{heading}</p>
      <Select
        variant="float"
        label={label}
        value={value}
        options={options}
        aria-label={heading}
        onChange={onChange}
      />
    </div>
  );
}

function VerificationBlock({
  title,
  sentAt,
  receivedAt,
  pdfLabel,
  href,
  children,
}: {
  title: string;
  sentAt: string;
  receivedAt: string;
  pdfLabel: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className={CARD}>
      <h2 className="text-base font-semibold text-black">{title}</h2>
      <div className="overflow-hidden rounded-xs border border-gray-light">
        <table className="uw-data-table">
          <thead className="bg-gray-lightest">
            <tr>
              <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">
                Date Sent (EST)
              </th>
              <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">
                Date Received (EST)
              </th>
              <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">
                Requested by
              </th>
              <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">Status</th>
              <th className="border-b border-gray-light px-xl py-3 font-semibold text-black">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-light px-xl py-md whitespace-nowrap text-gray-dark">
                {estDateTime(sentAt)}
              </td>
              <td className="border-b border-gray-light px-xl py-md whitespace-nowrap text-gray-dark">
                {estDateTime(receivedAt)}
              </td>
              <td className="border-b border-gray-light px-xl py-md text-gray-dark">System</td>
              <td className="border-b border-gray-light px-xl py-md text-gray-dark">Success</td>
              <td className="border-b border-gray-light px-xl py-md text-gray-dark">Partial Match</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Link href={href} className="uw-btn-link">
        {pdfLabel}
      </Link>
      {children}
    </section>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="inline-flex text-gray-dark" title={text}>
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
        <path d="M8 7.25v4" stroke="currentColor" strokeLinecap="round" />
        <circle cx="8" cy="5.25" r="0.75" fill="currentColor" />
      </svg>
      <span className="sr-only">{text}</span>
    </span>
  );
}
