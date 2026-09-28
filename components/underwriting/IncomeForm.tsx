"use client";

import { NumberField, ReadField } from "@/components/shared/Fields";
import { FlagList } from "@/components/shared/FlagLine";
import { Select } from "@/components/ui/Dropdown";
import type { Application, IncomeFrequency, IncomeWorksheet } from "@/lib/types";
import { money, percent } from "@/lib/format";
import { calculate } from "@/lib/calculations";
import { incomeVariance, stepFlags } from "@/lib/workflow";

const frequencies: IncomeFrequency[] = [
  "annual",
  "monthly",
  "semi-monthly",
  "biweekly",
  "weekly",
  "hourly",
  "ytd",
];

export function IncomeForm({
  application,
  onChange,
  readOnly = false,
}: {
  application: Application;
  onChange: (patch: {
    income?: IncomeWorksheet;
    borrower?: Application["borrower"];
  }) => void;
  readOnly?: boolean;
}) {
  const income = application.income;
  const job = application.employment[0];
  const calc = calculate(application);
  const variance = incomeVariance(application);

  function setIncome(patch: Partial<IncomeWorksheet>) {
    onChange({ income: { ...income, ...patch } });
  }

  return (
    <div className="space-y-md">
      <section className="uw-card-pad">
        <h2 className="text-sm font-semibold text-navy">Applicant</h2>
        <div className="mt-sm grid gap-md sm:grid-cols-3">
          <ReadField label="Name" value={application.borrower.fullName} source="application" />
          <ReadField label="Employer" value={job?.employer || "—"} source="pay stubs" />
          <ReadField label="Degree" value={application.borrower.degree} source="degree conferral" />
          <NumberField
            label="Credit score"
            value={application.borrower.creditScore}
            readOnly={readOnly}
            source="credit report"
            onChange={(creditScore) =>
              onChange({ borrower: { ...application.borrower, creditScore } })
            }
          />
          <NumberField
            label="FICO"
            value={application.borrower.fico}
            readOnly={readOnly}
            source="credit report"
            onChange={(fico) => onChange({ borrower: { ...application.borrower, fico } })}
          />
          <ReadField
            label="Stated annual income"
            value={money(application.borrower.statedAnnualIncome)}
            source="application"
          />
        </div>
      </section>

      <section className="uw-card-pad">
        <h2 className="text-sm font-semibold text-navy">Verified pay</h2>
        <div className="mt-sm grid gap-md sm:grid-cols-3">
          <div className="text-xs text-gray-medium">
            Frequency
            <Select
              variant="input"
              className="mt-xs"
              value={income.selectedFrequency}
              disabled={readOnly}
              aria-label="Frequency"
              options={frequencies}
              onChange={(selectedFrequency) =>
                setIncome({ selectedFrequency: selectedFrequency as IncomeFrequency })
              }
            />
            <div className="mt-xs text-[11px] text-gray-medium">From: pay stubs</div>
          </div>
          <NumberField
            label="Gross pay"
            value={income.grossPay}
            readOnly={readOnly}
            source="pay stubs"
            onChange={(grossPay) => setIncome({ grossPay })}
          />
          <NumberField
            label="Hours (hourly)"
            value={income.hours}
            readOnly={readOnly}
            source="pay stubs"
            onChange={(hours) => setIncome({ hours })}
          />
          <NumberField
            label="YTD pay periods"
            value={income.payPeriods}
            readOnly={readOnly}
            source="pay stubs"
            onChange={(payPeriods) => setIncome({ payPeriods })}
          />
          <NumberField
            label="Variable YTD"
            value={income.variableYtd}
            readOnly={readOnly}
            source="pay stubs"
            onChange={(variableYtd) => setIncome({ variableYtd })}
          />
          <NumberField
            label="Variable pay periods"
            value={income.variablePayPeriods}
            readOnly={readOnly}
            source="pay stubs"
            onChange={(variablePayPeriods) => setIncome({ variablePayPeriods })}
          />
          <NumberField
            label="Prior year income"
            value={income.priorYearIncome}
            readOnly={readOnly}
            source="W-2"
            onChange={(priorYearIncome) => setIncome({ priorYearIncome })}
          />
          <NumberField
            label="Housing payment"
            value={income.housingPayment}
            readOnly={readOnly}
            source="application"
            onChange={(housingPayment) => setIncome({ housingPayment })}
          />
          <ReadField
            label="Monthly income (calculated)"
            value={money(calc.monthlyIncome)}
            source="verified pay, annualized / 12"
          />
        </div>
        {variance != null ? (
          <p className="mt-sm text-xs text-gray-medium">
            Stated {money(application.borrower.statedAnnualIncome)} vs verified{" "}
            {money(calc.annualizedIncome)} ({percent(variance)} difference).
          </p>
        ) : null}
      </section>

      <FlagList flags={stepFlags(application, "underwriting")} />
    </div>
  );
}
