"use client";

import { useState, type ReactNode } from "react";
import { hydrateCalculator } from "@/lib/calculations/income";
import { money } from "@/lib/format";
import type { Application, ApplicationPatch, IncomeCalculator, IncomeWorksheet } from "@/lib/types";

type CalcRow = keyof IncomeCalculator;

const CURRENT_YEAR = new Date().getFullYear();
const PRIOR_YEAR = CURRENT_YEAR - 1;

export function IncomeCalculatorPanel({
  application,
  onChange,
}: {
  application: Application;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const income = application.income;
  const calc = hydrateCalculator(income);

  function patchCalc(nextCalc: IncomeCalculator, row: CalcRow) {
    onChange({ income: syncWorksheet(income, nextCalc, row) });
  }

  function setField(row: CalcRow, value: number) {
    patchCalc({ ...calc, [row]: value }, row);
  }

  const ytdPerPeriod = calc.ytdPeriods ? calc.ytdGross / calc.ytdPeriods : null;
  const ytdAnnual =
    ytdPerPeriod != null && calc.ytdAnnualPeriods ? ytdPerPeriod * calc.ytdAnnualPeriods : null;
  const ytdMonthly = ytdAnnual != null ? ytdAnnual / 12 : null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <CalcRow label="Annual">
          <InputCell
            label="Gross Pay"
            value={calc.annual}
            moneyPrefix
            onChange={(value) => setField("annual", value)}
          />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={calc.annual / 12} tone="final" />
        </CalcRow>

        <CalcRow label="Monthly">
          <InputCell
            label="Gross Pay"
            value={calc.monthly}
            moneyPrefix
            onChange={(value) => setField("monthly", value)}
          />
          <Operator symbol="X" />
          <ConstCell value="12" />
          <Operator symbol="=" />
          <ResultCell value={calc.monthly * 12} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={calc.monthly} tone="final" />
        </CalcRow>

        <CalcRow label="Semi Monthly">
          <InputCell
            label="Gross Pay"
            value={calc.semiMonthly}
            moneyPrefix
            onChange={(value) => setField("semiMonthly", value)}
          />
          <Operator symbol="X" />
          <ConstCell value="24" />
          <Operator symbol="=" />
          <ResultCell value={calc.semiMonthly * 24} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={(calc.semiMonthly * 24) / 12} tone="final" />
        </CalcRow>

        <CalcRow label="Biweekly">
          <InputCell
            label="Gross Pay"
            value={calc.biweekly}
            moneyPrefix
            onChange={(value) => setField("biweekly", value)}
          />
          <Operator symbol="X" />
          <ConstCell value="26" />
          <Operator symbol="=" />
          <ResultCell value={calc.biweekly * 26} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={(calc.biweekly * 26) / 12} tone="final" />
        </CalcRow>

        <CalcRow label="Weekly">
          <InputCell
            label="Gross Pay"
            value={calc.weekly}
            moneyPrefix
            onChange={(value) => setField("weekly", value)}
          />
          <Operator symbol="X" />
          <ConstCell value="52" />
          <Operator symbol="=" />
          <ResultCell value={calc.weekly * 52} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={(calc.weekly * 52) / 12} tone="final" />
        </CalcRow>

        <CalcRow label="Hourly">
          <InputCell
            label="Gross Pay"
            value={calc.hourlyRate}
            moneyPrefix
            onChange={(value) => setField("hourlyRate", value)}
          />
          <Operator symbol="X" />
          <InputCell
            label="Hours"
            value={calc.hourlyHours}
            onChange={(value) => setField("hourlyHours", value)}
          />
          <Operator symbol="=" />
          <ResultCell value={calc.hourlyRate * calc.hourlyHours} tone="mid" />
          <Operator symbol="X" />
          <ConstCell value="52" />
          <Operator symbol="=" />
          <ResultCell value={calc.hourlyRate * calc.hourlyHours * 52} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={(calc.hourlyRate * calc.hourlyHours * 52) / 12} tone="final" />
        </CalcRow>

        <CalcRow label="YTD Regular Income">
          <InputCell
            label="Gross Pay"
            value={calc.ytdGross}
            moneyPrefix
            onChange={(value) => setField("ytdGross", value)}
          />
          <InputCell
            label="Divided by (PP)"
            value={calc.ytdPeriods}
            onChange={(value) => setField("ytdPeriods", value)}
          />
          <Operator symbol="=" />
          <ResultCell value={ytdPerPeriod} tone="mid" />
          <Operator symbol="X" />
          <InputCell
            label="PP"
            value={calc.ytdAnnualPeriods}
            onChange={(value) => setField("ytdAnnualPeriods", value)}
          />
          <Operator symbol="=" />
          <ResultCell value={ytdAnnual} tone="mid" />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={ytdMonthly} tone="final" />
        </CalcRow>

        <CalcRow label={String(CURRENT_YEAR)}>
          <InputCell
            label="Gross Pay"
            value={calc.yearCurrent}
            moneyPrefix
            onChange={(value) => setField("yearCurrent", value)}
          />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={calc.yearCurrent / 12} tone="final" />
        </CalcRow>

        <CalcRow label={String(PRIOR_YEAR)}>
          <InputCell
            label="Gross Pay"
            value={calc.yearPrior}
            moneyPrefix
            onChange={(value) => setField("yearPrior", value)}
          />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={calc.yearPrior / 12} tone="final" />
        </CalcRow>
      </div>
    </div>
  );
}

function syncWorksheet(
  income: IncomeWorksheet,
  calculator: IncomeCalculator,
  row: CalcRow,
): IncomeWorksheet {
  const next = { ...income, calculator };
  switch (row) {
    case "annual":
      return { ...next, selectedFrequency: "annual", grossPay: calculator.annual };
    case "monthly":
      return { ...next, selectedFrequency: "monthly", grossPay: calculator.monthly };
    case "semiMonthly":
      return { ...next, selectedFrequency: "semi-monthly", grossPay: calculator.semiMonthly };
    case "biweekly":
      return { ...next, selectedFrequency: "biweekly", grossPay: calculator.biweekly };
    case "weekly":
      return { ...next, selectedFrequency: "weekly", grossPay: calculator.weekly };
    case "hourlyRate":
    case "hourlyHours":
      return {
        ...next,
        selectedFrequency: "hourly",
        grossPay: calculator.hourlyRate,
        hours: calculator.hourlyHours,
      };
    case "ytdGross":
    case "ytdPeriods":
    case "ytdAnnualPeriods":
      return {
        ...next,
        selectedFrequency: "ytd",
        grossPay: calculator.ytdGross,
        payPeriods: calculator.ytdPeriods,
      };
    case "yearCurrent":
      return { ...next, selectedFrequency: "annual", grossPay: calculator.yearCurrent };
    case "yearPrior":
      return {
        ...next,
        selectedFrequency: "annual",
        grossPay: calculator.yearPrior,
        priorYearIncome: calculator.yearPrior,
      };
  }
}

function CalcRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-md border-b border-gray-light px-xl py-md">
      <p className="w-[200px] shrink-0 pb-[7px] text-sm font-semibold whitespace-nowrap text-black">{label}</p>
      <div className="flex items-end gap-3">{children}</div>
    </div>
  );
}

function InputCell({
  label,
  value,
  moneyPrefix = false,
  onChange,
}: {
  label: string;
  value: number;
  moneyPrefix?: boolean;
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
          <span className="pointer-events-none absolute inset-y-0 left-sm flex items-center text-base text-gray-medium">
            $
          </span>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          className={`uw-input w-[140px] rounded-xs text-base ${moneyPrefix ? "pl-lg" : ""} ${
            !focused && empty ? "text-gray-medium" : ""
          }`}
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
            if (next !== "" && !/^\d*\.?\d*$/.test(next)) return;
            setDraft(next);
            const parsed = Number.parseFloat(next);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
        />
      </span>
    </label>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span className="flex min-h-[34px] w-5 shrink-0 items-center justify-center text-base font-semibold text-gray-dark">
      {symbol}
    </span>
  );
}

function ConstCell({ label, value }: { label?: string; value: string }) {
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

function ResultCell({ value, tone }: { value: number | null; tone: "mid" | "final" }) {
  const dashed = value == null;
  return (
    <input
      readOnly
      tabIndex={-1}
      className={`uw-input w-[128px] rounded-xs text-right text-base font-semibold ${
        tone === "final" ? "border-primary bg-primary-bg text-primary" : "bg-gray-lightest"
      }`}
      value={dashed ? "—" : money(value)}
    />
  );
}
