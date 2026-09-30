"use client";

import { useState, type ReactNode } from "react";
import { money } from "@/lib/format";

export function CalcNote({ children }: { children: ReactNode }) {
  return <p className="px-xl pt-md text-sm text-gray-medium">{children}</p>;
}

export function CalcRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-md border-b border-gray-light px-xl py-md">
      <p className="w-[200px] shrink-0 pb-[7px] text-sm font-semibold whitespace-nowrap text-black">{label}</p>
      <div className="flex items-end gap-3">{children}</div>
    </div>
  );
}

export function InputCell({
  label,
  value,
  moneyPrefix = false,
  allowNegative = false,
  onChange,
}: {
  label: string;
  value: number;
  moneyPrefix?: boolean;
  allowNegative?: boolean;
  onChange: (value: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const empty = !value;
  const display = focused ? draft : value.toFixed(2);

  return (
    <label className="flex min-w-[128px] flex-col items-start gap-xs">
      <span className="text-xs whitespace-nowrap text-gray-medium">{label}</span>
      <span className="relative block">
        {moneyPrefix ? (
          <span
            className={`pointer-events-none absolute inset-y-0 left-sm flex items-center text-base ${
              !focused && empty ? "text-gray-medium" : "text-gray-dark"
            }`}
          >
            $
          </span>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          className={`uw-input uw-calc-entry w-[140px] rounded-xs text-base ${
            moneyPrefix ? "uw-calc-money" : ""
          } ${!focused && empty ? "uw-calc-empty" : ""}`}
          value={display}
          onFocus={() => {
            setFocused(true);
            setDraft(empty ? "" : String(value));
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = Number.parseFloat(draft);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          onChange={(event) => {
            const next = event.target.value;
            const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
            if (next !== "" && next !== "-" && !pattern.test(next)) return;
            setDraft(next);
            const parsed = Number.parseFloat(next);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
        />
      </span>
    </label>
  );
}

export function Operator({ symbol }: { symbol: string }) {
  return (
    <span className="flex min-h-[34px] w-5 shrink-0 items-center justify-center text-base font-semibold text-gray-dark">
      {symbol}
    </span>
  );
}

export function ConstCell({ label, value }: { label?: string; value: string }) {
  return (
    <div className="flex min-w-[92px] flex-col items-start gap-xs">
      {label ? <p className="text-xs whitespace-nowrap text-gray-medium">{label}</p> : null}
      <input
        readOnly
        tabIndex={-1}
        aria-label={label || value}
        className="uw-input w-[92px] rounded-xs bg-gray-lightest text-center text-base font-semibold"
        value={value}
      />
    </div>
  );
}

export function ResultCell({
  value,
  tone,
  label,
}: {
  value: number | null;
  tone: "mid" | "final";
  label?: string;
}) {
  const dashed = value == null;
  const input = (
    <input
      readOnly
      tabIndex={-1}
      aria-label={label}
      className={`uw-input w-[128px] rounded-xs text-right text-base font-semibold ${
        tone === "final" ? "uw-calc-final" : "uw-calc-mid"
      }`}
      value={dashed ? "—" : money(value)}
    />
  );
  if (!label) return input;
  return (
    <label className="flex flex-col items-start gap-xs">
      <span className="text-xs whitespace-nowrap text-gray-medium">{label}</span>
      {input}
    </label>
  );
}
