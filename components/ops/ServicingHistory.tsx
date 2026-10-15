"use client";

import { money } from "@/lib/format";
import { useStore } from "@/lib/store";

export const SERVICING_SECTIONS = [
  { id: "feed", label: "Feed" },
  { id: "documents", label: "Documents" },
  { id: "cda-history", label: "CDA History" },
  { id: "disbursement-history", label: "Disbursement History" },
  { id: "rates-history", label: "Rates History" },
] as const;

export type ServicingSection = (typeof SERVICING_SECTIONS)[number]["id"];

const TH = "h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black";
const TD = "border-b border-gray-light px-xl py-md text-sm text-black";

const PRODUCTS: Record<string, string> = {
  immediate: "Immediate",
  fixed: "Fixed",
  "interest-only": "Interest Only",
  deferred: "Deferred",
};

function stamp(value: string) {
  if (!value) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

function amountCell(value: string) {
  const numeric = Number(value.replace(/[$,]/g, ""));
  if (!value.trim() || !Number.isFinite(numeric)) return money(0);
  return money(numeric);
}

export function DisbursementHistory({ applicationId }: { applicationId: string }) {
  const { getApplication } = useStore();
  const rows = getApplication(applicationId)?.disbursementHistory ?? [];

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">Disbursement History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="uw-data-table min-w-[880px]">
          <thead className="bg-gray-lightest">
            <tr>
              <th className={TH}>Serial No</th>
              <th className={TH}>Disbursement Date</th>
              <th className={TH}>Disbursement Amount</th>
              <th className={TH}>Status</th>
              <th className={TH}>Status Updated Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={TD} colSpan={5}>
                  No disbursement history.
                </td>
              </tr>
            ) : (
              rows.map((line, index) => (
                <tr key={line.id}>
                  <td className={TD}>{index + 1}.</td>
                  <td className={TD}>{line.date.trim() ? stamp(line.date) : "—"}</td>
                  <td className={TD}>{amountCell(line.amount)}</td>
                  <td className={TD}>{line.status}</td>
                  <td className={TD}>{stamp(line.statusUpdatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RatesHistory({ applicationId }: { applicationId: string }) {
  const { getApplication } = useStore();
  const rows = getApplication(applicationId)?.rateHistory ?? [];

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">Rates History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="uw-data-table min-w-[880px]">
          <thead className="bg-gray-lightest">
            <tr>
              <th className={TH}>Updated</th>
              <th className={TH}>Product</th>
              <th className={TH}>Rate Type</th>
              <th className={TH}>Term</th>
              <th className={TH}>Rate</th>
              <th className={TH}>P&I Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={TD} colSpan={6}>
                  No rate history.
                </td>
              </tr>
            ) : (
              rows.map((entry) => (
                <tr key={entry.id}>
                  <td className={TD}>{stamp(entry.at)}</td>
                  <td className={TD}>{PRODUCTS[entry.product] ?? entry.product}</td>
                  <td className={TD}>{entry.rateType}</td>
                  <td className={TD}>{entry.term} mo</td>
                  <td className={TD}>{entry.rate}</td>
                  <td className={TD}>{entry.payment}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
