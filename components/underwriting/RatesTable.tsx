"use client";

import { Fragment } from "react";
import {
  dtiForPayment,
  formatGridRate,
  formatGridValue,
  liabilitiesForPayment,
  marginFor,
  paymentFor,
  RATE_TERMS,
  rateFor,
  type RateKind,
  type RateProduct,
} from "@/lib/calculations/rates";
import type { Application } from "@/lib/types";

export function RatesTable({
  application,
  product = "immediate",
  onSelect,
  readOnly = false,
}: {
  application: Application;
  product?: RateProduct;
  onSelect?: (patch: {
    requestedTerm: number;
    requestedRateType: RateKind;
    income: Application["income"];
  }) => void;
  readOnly?: boolean;
}) {
  function select(kind: RateKind, term: (typeof RATE_TERMS)[number]) {
    const payment = paymentFor(application, kind, term, product);
    if (payment == null || readOnly || !onSelect) return;
    onSelect({
      requestedTerm: term,
      requestedRateType: kind,
      income: { ...application.income, estimatedNewPayment: payment },
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="uw-data-table min-w-[1100px] table-fixed">
        <thead className="bg-gray-lightest">
          <tr>
            <th className="h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black">
              Rate Type
            </th>
            {RATE_TERMS.map((term) => (
              <Fragment key={term}>
                <th className="h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black">
                  {term}
                </th>
                <th className="h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black">
                  P&I Pmt.
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          <RateRow
            label="Fixed"
            kind="Fixed"
            application={application}
            product={product}
            onSelect={select}
          />
          <MetricRow
            label="DTI/Total Liabilities"
            kind="Fixed"
            application={application}
            product={product}
          />
          <MarginRow />
          <RateRow
            label="VARIABLE"
            kind="Variable"
            application={application}
            product={product}
            onSelect={select}
          />
          <MetricRow
            label="DTI/Total Liabilities"
            kind="Variable"
            application={application}
            product={product}
          />
        </tbody>
      </table>
    </div>
  );
}

function RateRow({
  label,
  kind,
  application,
  product,
  onSelect,
}: {
  label: string;
  kind: RateKind;
  application: Application;
  product: RateProduct;
  onSelect: (kind: RateKind, term: (typeof RATE_TERMS)[number]) => void;
}) {
  return (
    <tr>
      <td className="border-b border-gray-light px-xl py-md">{label}</td>
      {RATE_TERMS.map((term) => {
        const rate = rateFor(kind, term);
        const payment = paymentFor(application, kind, term, product);
        const rateLabel = formatGridRate(rate);
        return (
          <Fragment key={`${kind}-${term}`}>
            <td className="border-b border-gray-light px-xl py-md">
              {rateLabel === "-" ? (
                "-"
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(kind, term)}
                  className="rounded-xs bg-yellow px-[12px] py-xs text-base text-gray-dark"
                >
                  {rateLabel}
                </button>
              )}
            </td>
            <td className="border-b border-gray-light px-xl py-md">
              {payment == null ? "-" : formatGridValue(payment)}
            </td>
          </Fragment>
        );
      })}
    </tr>
  );
}

function MetricRow({
  label,
  kind,
  application,
  product,
}: {
  label: string;
  kind: RateKind;
  application: Application;
  product: RateProduct;
}) {
  return (
    <tr>
      <td className="border-b border-gray-light px-xl py-md">{label}</td>
      {RATE_TERMS.map((term) => {
        const payment = paymentFor(application, kind, term, product);
        const dti = dtiForPayment(application, payment);
        const liabilities = liabilitiesForPayment(application, payment);
        return (
          <Fragment key={`${kind}-dti-${term}`}>
            <td className="border-b border-gray-light px-xl py-md">
              {dti == null ? "" : formatGridValue(dti * 100)}
            </td>
            <td className="border-b border-gray-light px-xl py-md">
              {liabilities == null ? "" : formatGridValue(liabilities)}
            </td>
          </Fragment>
        );
      })}
    </tr>
  );
}

function MarginRow() {
  return (
    <tr>
      <td className="border-b border-gray-light px-xl py-md">MARGIN</td>
      {RATE_TERMS.map((term) => {
        const margin = marginFor(term);
        return (
          <Fragment key={`margin-${term}`}>
            <td className="border-b border-gray-light px-xl py-md">
              {margin == null ? "-" : formatGridRate(margin)}
            </td>
            <td className="border-b border-gray-light px-xl py-md">-</td>
          </Fragment>
        );
      })}
    </tr>
  );
}
