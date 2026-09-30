"use client";

import { CalcRow, ConstCell, InputCell, Operator, ResultCell } from "@/components/underwriting/calc-fields";
import { hydrateCalculator } from "@/lib/calculations/income";
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

