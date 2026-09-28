"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { FloatInput } from "@/components/ui/FloatInput";
import { sampleDocumentHref } from "@/lib/documents";
import { exportLiabilities } from "@/lib/export/xlsx";
import { money } from "@/lib/format";
import type { Application, ApplicationPatch, DebtTrade } from "@/lib/types";

export function UnderwritingLiabilities({
  application,
  onChange,
  showHeader = false,
  basePath,
}: {
  application: Application;
  readOnly: boolean;
  onChange: (patch: ApplicationPatch) => void;
  showHeader?: boolean;
  basePath?: string;
}) {
  const trades = application.debtTrades;
  const total = trades.reduce(
    (sum, trade) => sum + ((trade.adjPayment ?? trade.payment) || 0),
    0,
  );
  const creditDoc = application.documents.find((item) => item.kind === "credit-report");
  const reportHref = creditDoc
    ? sampleDocumentHref(creditDoc.fileName)
    : `${basePath ?? ""}/documents`;

  function patchTrade(id: string, next: Partial<DebtTrade>) {
    onChange({
      debtTrades: trades.map((item) => (item.id === id ? { ...item, ...next } : item)),
    });
  }

  const body = (
      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <table className="uw-data-table min-w-[1360px] table-fixed">
            <colgroup>
              <col className="w-[76px]" />
              <col className="w-[188px]" />
              <col className="w-[70px]" />
              <col className="w-[188px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col />
            </colgroup>
            <thead className="bg-gray-lightest">
              <tr>
                <th className="h-11 border-b border-gray-light px-xl" />
                <Th>Creditor Name</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th align="right">Payment</Th>
                <Th align="right">Sys Pmt</Th>
                <Th align="right">Adj Pmt</Th>
                <Th align="right">Balance</Th>
                <Th align="right">Original Balance</Th>
                <Th>Reported</Th>
                <Th>ECOA</Th>
              </tr>
            </thead>
            <tbody>
              {trades.map((item) => {
                const adj = item.adjPayment ?? item.payment;
                const sys = item.sysPayment ?? item.payment;
                const original = item.originalBalance ?? item.highCredit;
                function toggleInclude() {
                  const includeInDti = !item.includeInDti;
                  patchTrade(item.id, {
                    includeInDti,
                    adjPayment: includeInDti && !adj ? sys : adj,
                  });
                }

                function onRowClick(event: MouseEvent<HTMLTableRowElement>) {
                  if ((event.target as HTMLElement).closest("a, button, input, label, select, textarea")) {
                    return;
                  }
                  toggleInclude();
                }

                return (
                  <tr key={item.id} className="uw-list-row h-[62px]" onClick={onRowClick}>
                    <td className="border-b border-gray-light px-xl py-md">
                      <TradeCheckbox
                        checked={item.includeInDti}
                        label={`Include ${item.category} in DTI`}
                        onChange={toggleInclude}
                      />
                    </td>
                    <Td>{item.lender}</Td>
                    <Td>{item.accountType}</Td>
                    <Td>
                      <span className="block break-words whitespace-normal">{item.category}</span>
                    </Td>
                    <Td align="right">{item.payment ? money(item.payment) : ""}</Td>
                    <Td align="right">{money(sys)}</Td>
                    <td className="border-b border-gray-light px-xl py-md">
                      <AdjInput
                        value={adj}
                        ariaLabel={`${item.category} adjusted payment`}
                        onChange={(adjPayment) => patchTrade(item.id, { adjPayment })}
                      />
                    </td>
                    <Td align="right">{money(item.balance)}</Td>
                    <Td align="right">{money(original)}</Td>
                    <Td>{item.reportedAt || ""}</Td>
                    <Td>{item.ecoa || ""}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-md bg-gray-lightest px-md py-md">
          <div className="w-[401px] max-w-full">
            <HousingExpenseInput
              value={application.income.housingPayment}
              onChange={(housingPayment) =>
                onChange({ income: { ...application.income, housingPayment } })
              }
            />
          </div>
          <p className="flex items-center gap-xs text-xl font-semibold whitespace-nowrap text-black">
            <span className="text-lg">Total Monthly Liabilities:</span>
            <span className={YELLOW_VALUE}>{money(total)}</span>
          </p>
        </div>
      </div>
  );

  if (!showHeader) return body;

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Credit Report Liabilities</h1>
        <div className="flex shrink-0 items-center gap-sm">
          <Button variant="secondary" className="h-[31px]" onClick={() => exportLiabilities(application)}>
            Export to Excel
          </Button>
          <Link href={reportHref} className={buttonClass("primary")}>
            View Credit Report
          </Link>
        </div>
      </div>
      {body}
    </div>
  );
}

const YELLOW_VALUE =
  "ml-auto block w-[105px] rounded-xs bg-yellow px-3 py-xs text-right text-base text-gray-dark";

function HousingExpenseInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const display = focused ? (draft ? `$${draft}` : "") : value ? money(value) : "";

  function commit(raw: string) {
    const stripped = raw.replace(/[$,]/g, "");
    if (stripped !== "" && !/^\d*\.?\d*$/.test(stripped)) return;
    setDraft(stripped);
    const parsed = Number.parseFloat(stripped);
    onChange(Number.isFinite(parsed) ? parsed : 0);
  }

  return (
    <FloatInput
      label="Primary Housing Expenses"
      value={display}
      onFocus={() => {
        setFocused(true);
        setDraft(value ? String(value) : "");
      }}
      onBlur={() => setFocused(false)}
      onChange={commit}
    />
  );
}

function Th({ children, align }: { children: string; align?: "right" }) {
  return (
    <th
      className={`h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: ReactNode; align?: "right" }) {
  return (
    <td
      className={`border-b border-gray-light px-xl py-md text-sm text-gray-dark ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );
}

function AdjInput({
  value,
  ariaLabel,
  onChange,
}: {
  value: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const display = focused ? draft : money(value);

  return (
    <input
      aria-label={ariaLabel}
      className={`${YELLOW_VALUE} border-0 outline-none`}
      value={display}
      onFocus={() => {
        setFocused(true);
        setDraft(value ? String(value) : "");
      }}
      onBlur={() => {
        setFocused(false);
        onChange(parseMoney(draft));
      }}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        onChange(parseMoney(next));
      }}
    />
  );
}

function TradeCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex size-7 shrink-0 items-center justify-center rounded-[2px] border ${
        checked ? "border-primary bg-primary text-white" : "border-gray-dark bg-white"
      }`}
    >
      {checked ? <CheckIcon /> : null}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2l2.4 2.4 4.6-5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function parseMoney(value: string) {
  const next = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(next) ? next : 0;
}
