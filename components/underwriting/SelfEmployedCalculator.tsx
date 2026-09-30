"use client";

import { CalcNote, CalcRow, ConstCell, InputCell, Operator, ResultCell } from "@/components/underwriting/calc-fields";
import { hydrateSelfEmployed, selfEmployedBreakdown } from "@/lib/calculations/income";
import type { Application, ApplicationPatch, IncomeWorksheet, SelfEmployedCalculator } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const PRIOR_YEAR = CURRENT_YEAR - 1;

const METHOD_LABEL = {
  average: "2-year average",
  "lower-year": "Lower year",
  "ytd-cap": "Current stable income",
  single: "Qualifying",
  none: "Qualifying",
} as const;

export function SelfEmployedCalculatorPanel({
  application,
  onChange,
}: {
  application: Application;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const income = application.income;
  const calc = hydrateSelfEmployed(income);
  const breakdown = selfEmployedBreakdown(calc);

  function setField(field: keyof SelfEmployedCalculator, value: number) {
    const next = { ...calc, [field]: value };
    onChange({ income: applyMonthly(income, next, selfEmployedBreakdown(next).qualifyingMonthly) });
  }

  return (
    <div className="overflow-x-auto">
      <CalcNote>
        Analyze tax returns and YTD business performance together. Add back only documented recurring, non-cash
        expenses; deduct nonrecurring income. The qualifying result is capped at a lower YTD run rate when current
        business income has declined.
      </CalcNote>
      <div className="min-w-max">
        <YearRow
          label={String(CURRENT_YEAR)}
          net={calc.currentNet}
          depreciation={calc.currentDepreciation}
          homeUse={calc.currentHomeUse}
          depletionAmortization={calc.currentDepletionAmortization}
          otherAddbacks={calc.currentOtherAddbacks}
          nonRecurringIncome={calc.currentNonRecurringIncome}
          adjusted={breakdown.currentAdjusted}
          monthly={breakdown.currentMonthly}
          onNet={(value) => setField("currentNet", value)}
          onDepreciation={(value) => setField("currentDepreciation", value)}
          onHomeUse={(value) => setField("currentHomeUse", value)}
          onDepletionAmortization={(value) => setField("currentDepletionAmortization", value)}
          onOtherAddbacks={(value) => setField("currentOtherAddbacks", value)}
          onNonRecurringIncome={(value) => setField("currentNonRecurringIncome", value)}
        />
        <YearRow
          label={String(PRIOR_YEAR)}
          net={calc.priorNet}
          depreciation={calc.priorDepreciation}
          homeUse={calc.priorHomeUse}
          depletionAmortization={calc.priorDepletionAmortization}
          otherAddbacks={calc.priorOtherAddbacks}
          nonRecurringIncome={calc.priorNonRecurringIncome}
          adjusted={breakdown.priorAdjusted}
          monthly={breakdown.priorMonthly}
          onNet={(value) => setField("priorNet", value)}
          onDepreciation={(value) => setField("priorDepreciation", value)}
          onHomeUse={(value) => setField("priorHomeUse", value)}
          onDepletionAmortization={(value) => setField("priorDepletionAmortization", value)}
          onOtherAddbacks={(value) => setField("priorOtherAddbacks", value)}
          onNonRecurringIncome={(value) => setField("priorNonRecurringIncome", value)}
        />
        <CalcRow label={METHOD_LABEL[breakdown.method]}>
          {breakdown.method === "average" ? (
            <>
              <ResultCell label={String(CURRENT_YEAR)} value={breakdown.currentAdjusted} tone="mid" />
              <Operator symbol="+" />
              <ResultCell label={String(PRIOR_YEAR)} value={breakdown.priorAdjusted} tone="mid" />
              <Operator symbol="=" />
              <ResultCell value={breakdown.qualifyingAnnual * 2} tone="mid" />
              <ConstCell label="Divided by" value="2" />
              <Operator symbol="=" />
            </>
          ) : null}
          <ResultCell
            label={breakdown.method === "average" ? "Average" : "Adjusted"}
            value={breakdown.qualifyingAnnual}
            tone="mid"
          />
          <ConstCell label="Divided by" value="12" />
          <Operator symbol="=" />
          <ResultCell value={breakdown.qualifyingMonthly} tone="final" />
        </CalcRow>
        <CalcRow label="YTD P&L">
          <InputCell
            label="YTD net"
            value={calc.ytdNet}
            moneyPrefix
            allowNegative
            onChange={(value) => setField("ytdNet", value)}
          />
          <Operator symbol="+" />
          <InputCell
            label="Documented add-backs"
            value={calc.ytdAddbacks}
            moneyPrefix
            onChange={(value) => setField("ytdAddbacks", value)}
          />
          <InputCell
            label="Divided by (months)"
            value={calc.ytdMonths}
            onChange={(value) => setField("ytdMonths", value)}
          />
          <Operator symbol="=" />
          <ResultCell value={breakdown.ytdMonthly} tone="final" />
        </CalcRow>
      </div>
    </div>
  );
}

function applyMonthly(
  income: IncomeWorksheet,
  selfEmployed: SelfEmployedCalculator,
  monthly: number,
): IncomeWorksheet {
  return {
    ...income,
    selfEmployed,
    selectedFrequency: "monthly",
    grossPay: Math.round(monthly * 100) / 100,
  };
}

function YearRow({
  label,
  net,
  depreciation,
  homeUse,
  depletionAmortization,
  otherAddbacks,
  nonRecurringIncome,
  adjusted,
  monthly,
  onNet,
  onDepreciation,
  onHomeUse,
  onDepletionAmortization,
  onOtherAddbacks,
  onNonRecurringIncome,
}: {
  label: string;
  net: number;
  depreciation: number;
  homeUse: number;
  depletionAmortization: number;
  otherAddbacks: number;
  nonRecurringIncome: number;
  adjusted: number;
  monthly: number;
  onNet: (value: number) => void;
  onDepreciation: (value: number) => void;
  onHomeUse: (value: number) => void;
  onDepletionAmortization: (value: number) => void;
  onOtherAddbacks: (value: number) => void;
  onNonRecurringIncome: (value: number) => void;
}) {
  return (
    <CalcRow label={label}>
      <InputCell label="Net profit" value={net} moneyPrefix allowNegative onChange={onNet} />
      <Operator symbol="+" />
      <InputCell label="Depreciation" value={depreciation} moneyPrefix onChange={onDepreciation} />
      <Operator symbol="+" />
      <InputCell label="Business home use" value={homeUse} moneyPrefix onChange={onHomeUse} />
      <Operator symbol="+" />
      <InputCell
        label="Depletion / amortization"
        value={depletionAmortization}
        moneyPrefix
        onChange={onDepletionAmortization}
      />
      <Operator symbol="+" />
      <InputCell label="Other documented add-backs" value={otherAddbacks} moneyPrefix onChange={onOtherAddbacks} />
      <Operator symbol="−" />
      <InputCell
        label="Nonrecurring income"
        value={nonRecurringIncome}
        moneyPrefix
        onChange={onNonRecurringIncome}
      />
      <Operator symbol="=" />
      <ResultCell value={adjusted} tone="mid" />
      <ConstCell label="Divided by" value="12" />
      <Operator symbol="=" />
      <ResultCell value={monthly} tone="final" />
    </CalcRow>
  );
}
