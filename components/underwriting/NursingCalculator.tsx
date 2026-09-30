"use client";

import { CalcNote, CalcRow, ConstCell, InputCell, Operator, ResultCell } from "@/components/underwriting/calc-fields";
import { hydrateNursing, nursingBreakdown, type NursingSource } from "@/lib/calculations/income";
import type { Application, ApplicationPatch, IncomeWorksheet, NursingCalculator } from "@/lib/types";

export function NursingCalculatorPanel({
  application,
  onChange,
}: {
  application: Application;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const income = application.income;
  const calc = hydrateNursing(income);
  const breakdown = nursingBreakdown(calc);

  function setField(field: keyof NursingCalculator, value: number) {
    const next = { ...calc, [field]: value };
    onChange({ income: applyMonthly(income, next, nursingBreakdown(next).qualifyingMonthly) });
  }

  function setIncluded(field: "hospitalIncluded" | "agencyIncluded" | "prnIncluded", included: boolean) {
    const next = { ...calc, [field]: included };
    onChange({ income: applyMonthly(income, next, nursingBreakdown(next).qualifyingMonthly) });
  }

  return (
    <div className="overflow-x-auto">
      <CalcNote>
        Enter taxable earnings separately for each hospital, agency, or PRN employer. Before including a source,
        confirm its history, documentation, and likely continuance. This preliminary worksheet uses the lower of the
        prior-year and YTD monthly amounts for each included source. Tax-free stipends are shown for comparison only.
      </CalcNote>
      <div className="min-w-max">
        <SourceRow
          label="Primary hospital"
          ytd={calc.hospitalYtd}
          ytdMonths={calc.hospitalYtdMonths}
          priorYear={calc.hospitalPriorYear}
          included={calc.hospitalIncluded}
          source={breakdown.hospital}
          onYtd={(value) => setField("hospitalYtd", value)}
          onYtdMonths={(value) => setField("hospitalYtdMonths", value)}
          onPriorYear={(value) => setField("hospitalPriorYear", value)}
          onIncluded={(value) => setIncluded("hospitalIncluded", value)}
        />
        <SourceRow
          label="Staffing agency / travel"
          ytd={calc.agencyYtd}
          ytdMonths={calc.agencyYtdMonths}
          priorYear={calc.agencyPriorYear}
          included={calc.agencyIncluded}
          source={breakdown.agency}
          onYtd={(value) => setField("agencyYtd", value)}
          onYtdMonths={(value) => setField("agencyYtdMonths", value)}
          onPriorYear={(value) => setField("agencyPriorYear", value)}
          onIncluded={(value) => setIncluded("agencyIncluded", value)}
        />
        <SourceRow
          label="PRN / other employer"
          ytd={calc.prnYtd}
          ytdMonths={calc.prnYtdMonths}
          priorYear={calc.prnPriorYear}
          included={calc.prnIncluded}
          source={breakdown.prn}
          onYtd={(value) => setField("prnYtd", value)}
          onYtdMonths={(value) => setField("prnYtdMonths", value)}
          onPriorYear={(value) => setField("prnPriorYear", value)}
          onIncluded={(value) => setIncluded("prnIncluded", value)}
        />
        <CalcRow label="Tax-free stipends">
          <InputCell
            label="YTD stipend"
            value={calc.stipendYtd}
            moneyPrefix
            onChange={(value) => setField("stipendYtd", value)}
          />
          <InputCell
            label="Months"
            value={calc.stipendYtdMonths}
            onChange={(value) => setField("stipendYtdMonths", value)}
          />
          <Operator symbol="=" />
          <ResultCell label="Monthly reference" value={breakdown.stipendMonthly} tone="mid" />
        </CalcRow>
        <CalcRow label="Qualifying">
          <ResultCell label="Primary hospital" value={calc.hospitalIncluded ? breakdown.hospital.qualifyingMonthly : 0} tone="mid" />
          <Operator symbol="+" />
          <ResultCell label="Agency" value={calc.agencyIncluded ? breakdown.agency.qualifyingMonthly : 0} tone="mid" />
          <Operator symbol="+" />
          <ResultCell label="PRN" value={calc.prnIncluded ? breakdown.prn.qualifyingMonthly : 0} tone="mid" />
          <Operator symbol="=" />
          <ResultCell value={breakdown.qualifyingMonthly} tone="final" />
        </CalcRow>
      </div>
    </div>
  );
}

function applyMonthly(income: IncomeWorksheet, nursing: NursingCalculator, monthly: number): IncomeWorksheet {
  return {
    ...income,
    nursing,
    selectedFrequency: "monthly",
    grossPay: Math.round(monthly * 100) / 100,
  };
}

function SourceRow({
  label,
  ytd,
  ytdMonths,
  priorYear,
  included,
  source,
  onYtd,
  onYtdMonths,
  onPriorYear,
  onIncluded,
}: {
  label: string;
  ytd: number;
  ytdMonths: number;
  priorYear: number;
  included: boolean;
  source: NursingSource;
  onYtd: (value: number) => void;
  onYtdMonths: (value: number) => void;
  onPriorYear: (value: number) => void;
  onIncluded: (value: boolean) => void;
}) {
  return (
    <CalcRow label={label}>
      <InputCell label="YTD taxable wages" value={ytd} moneyPrefix onChange={onYtd} />
      <InputCell label="YTD months" value={ytdMonths} onChange={onYtdMonths} />
      <Operator symbol="=" />
      <ResultCell label="YTD monthly" value={source.ytdMonthly} tone="mid" />
      <InputCell label="Prior-year wages" value={priorYear} moneyPrefix onChange={onPriorYear} />
      <ConstCell label="Divided by" value="12" />
      <Operator symbol="=" />
      <ResultCell label="Prior monthly" value={source.priorMonthly} tone="mid" />
      <label className="flex min-w-27.5 flex-col items-start gap-xs">
        <span className="text-xs whitespace-nowrap text-gray-medium">Include source</span>
        <input
          type="checkbox"
          checked={included}
          onChange={(event) => onIncluded(event.target.checked)}
          className="size-5 accent-primary"
        />
      </label>
      <ResultCell label="Qualifying" value={included ? source.qualifyingMonthly : 0} tone="final" />
    </CalcRow>
  );
}
