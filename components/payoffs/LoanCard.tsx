"use client";

import { useState, type MouseEvent } from "react";
import { Button } from "@/components/Button";
import { Combobox } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { money } from "@/lib/format";
import { lenderAddressOptions, normalizeLiability } from "@/lib/payoffs";
import type { Liability, PayoffType } from "@/lib/types";

export const LOAN_ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_12.5rem_9.5rem] items-center gap-3xl";

export function LoanCard({
  item,
  variant,
  last,
  index,
  readOnly,
  onChange,
}: {
  item: Liability;
  variant: "all" | "payoff";
  last?: boolean;
  index?: number;
  readOnly: boolean;
  onChange: (patch: Partial<Liability>) => void;
}) {
  const loan = normalizeLiability(item);

  function toggle() {
    if (readOnly) return;
    onChange({ selected: !loan.selected });
  }

  function onCardClick(event: MouseEvent<HTMLElement>) {
    if (readOnly) return;
    if ((event.target as HTMLElement).closest("a, button, input, label, select, textarea")) return;
    toggle();
  }

  if (variant === "payoff") {
    return (
      <div className="flex items-start gap-md">
        {index != null ? (
          <span
            className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-white"
            aria-hidden
          >
            {index}
          </span>
        ) : null}
        <article
          className={`min-w-0 flex-1 flex flex-col gap-md rounded-sm border border-gray-light bg-white px-xl py-lg transition-colors duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-gray-medium ${
            readOnly ? "" : "cursor-pointer"
          }`}
          onClick={onCardClick}
        >
        <div className="flex items-center justify-between gap-xl">
          <div className="flex min-w-0 items-center gap-lg">
            <SelectBox loan={loan} readOnly={readOnly} onToggle={toggle} />
            <div className="min-w-0">
              <p className="text-xl font-semibold text-black">{money(loan.balance)}</p>
              <p className="text-sm text-gray-medium">{loan.lender || "New student loan"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3xl">
            <div>
              <p className="text-xs text-gray-medium">Account Number</p>
              <p className="text-sm font-normal text-black tabular-nums">{loan.accountNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-medium">Monthly Payment</p>
              <p className="text-sm font-normal text-black tabular-nums">{money(loan.payment)}</p>
            </div>
          </div>
        </div>
        <PayoffFields loan={loan} readOnly={readOnly} onChange={onChange} />
        </article>
      </div>
    );
  }

  return (
    <article
      className={`bg-white hover:bg-gray-lightest ${last ? "" : "border-b border-gray-light"}`}
    >
      <label
        className={`${LOAN_ROW_GRID} px-xl py-lg ${readOnly ? "" : "cursor-pointer"}`}
      >
        <div className="flex min-w-0 items-center gap-lg">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={loan.selected}
            disabled={readOnly}
            onChange={toggle}
            aria-label={`Select ${loan.lender || "student loan"}`}
          />
          <SelectMark selected={loan.selected} readOnly={readOnly} />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-black">{money(loan.balance)}</p>
            <p className="text-sm text-gray-medium">{loan.lender || "New student loan"}</p>
          </div>
        </div>
        <p className="truncate text-sm font-normal text-black tabular-nums">{loan.accountNumber || "—"}</p>
        <p className="text-sm font-normal text-black tabular-nums">{money(loan.payment)}</p>
      </label>
    </article>
  );
}

function SelectBox({
  loan,
  readOnly,
  onToggle,
}: {
  loan: Liability;
  readOnly: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={loan.selected}
      aria-label={`Select ${loan.lender || "student loan"}`}
      disabled={readOnly}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="flex shrink-0 disabled:opacity-50"
    >
      <SelectMark selected={loan.selected} />
    </button>
  );
}

function SelectMark({ selected, readOnly }: { selected: boolean; readOnly?: boolean }) {
  return (
    <span
      className={`flex size-[21px] shrink-0 items-center justify-center rounded-[2px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
        selected ? "border-primary bg-primary text-white" : "border-gray-dark bg-white"
      } ${readOnly ? "opacity-50" : ""}`}
      aria-hidden
    >
      {selected ? <CheckIcon /> : null}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.2l2.4 2.4 4.6-5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PayoffFields({
  loan,
  readOnly,
  onChange,
}: {
  loan: Liability;
  readOnly: boolean;
  onChange: (patch: Partial<Liability>) => void;
}) {
  const [editingAddress, setEditingAddress] = useState(false);
  const addressOptions = lenderAddressOptions(loan.lender, loan.lenderAddresses);

  function selectAddress(next: string) {
    const address = next.trim();
    if (!address) return;
    const addresses = loan.lenderAddresses.includes(address)
      ? loan.lenderAddresses
      : [...loan.lenderAddresses, address];
    onChange({ lenderAddresses: addresses, selectedAddress: address });
    setEditingAddress(false);
  }

  function startEdit(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setEditingAddress(true);
  }

  function cancelEdit(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setEditingAddress(false);
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-sm">
        <PayoffToggle
          value={loan.payoffType}
          onChange={(payoffType) => onChange({ payoffType })}
        />
        <div className="grid grid-cols-4 gap-md">
          <FloatInput
            label="Adj Loan Balance"
            value={loan.adjBalance ? String(loan.adjBalance) : ""}
            readOnly={readOnly}
            onChange={(value) => onChange({ adjBalance: Number(value) || 0 })}
          />
          <FloatInput
            label="Loan Identifier"
            value={loan.adjLoanIdentifier}
            readOnly={readOnly}
            onChange={(value) => onChange({ adjLoanIdentifier: value })}
          />
          <FloatInput
            label="Adj Creditor Name"
            value={loan.adjCreditorName}
            readOnly={readOnly}
            onChange={(value) => onChange({ adjCreditorName: value })}
          />
          <FloatInput
            label="Adj Account Number"
            value={loan.adjAccountNumber}
            readOnly={readOnly}
            onChange={(value) => onChange({ adjAccountNumber: value })}
          />
        </div>
      </div>

      <div
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <p className="mb-sm text-xs text-gray-medium">Lender Address</p>
        {editingAddress && !readOnly ? (
          <div className="flex flex-col gap-sm">
            <Combobox
              label="Street Address"
              value={loan.selectedAddress}
              options={addressOptions}
              autoFocus
              onChange={selectAddress}
            />
            <Button variant="text" size="small" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-xs">
            <p className="text-sm font-semibold text-black">{loan.selectedAddress || "—"}</p>
            {readOnly ? null : (
              <Button variant="text" size="small" onClick={startEdit}>
                Edit address
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoffToggle({
  value,
  onChange,
}: {
  value: PayoffType;
  onChange: (value: PayoffType) => void;
}) {
  return (
    <div className="inline-flex items-center self-start overflow-hidden rounded-full border border-primary">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange("full");
        }}
        className={
          value === "full"
            ? "bg-primary px-md py-xs text-xs font-semibold text-white"
            : "px-md py-xs text-xs text-gray-dark"
        }
      >
        Full Payoff
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange("partial");
        }}
        className={
          value === "partial"
            ? "bg-primary px-md py-xs text-xs font-semibold text-white"
            : "px-md py-xs text-xs text-gray-dark"
        }
      >
        Partial Payoff
      </button>
    </div>
  );
}

