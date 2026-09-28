"use client";

import { NumberField } from "@/components/shared/Fields";
import { FlagList } from "@/components/shared/FlagLine";
import { calculate } from "@/lib/calculations";
import { money, percent } from "@/lib/format";
import { stepFlags } from "@/lib/workflow";
import type { Application } from "@/lib/types";

export function DebtForm({
  application,
  onChange,
  readOnly = false,
}: {
  application: Application;
  onChange: (patch: {
    debtTrades?: Application["debtTrades"];
    income?: Application["income"];
  }) => void;
  readOnly?: boolean;
}) {
  const calc = calculate(application);

  return (
    <div className="space-y-md">
      <section className="uw-card">
        <div className="px-md py-sm">
          <h2 className="text-sm font-semibold text-navy">Debt trade inputs</h2>
          <p className="text-xs text-gray-medium">
            Remaining trades still included in DTI after selected payoffs are removed.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="uw-data-table min-w-full">
            <thead className="uw-table-head">
              <tr>
                <th className="px-sm py-sm">In DTI</th>
                <th className="px-sm py-sm">Lender</th>
                <th className="px-sm py-sm">Category</th>
                <th className="px-sm py-sm">Balance</th>
                <th className="px-sm py-sm">Payment</th>
              </tr>
            </thead>
            <tbody>
              {application.debtTrades.map((trade) => (
                <tr key={trade.id} className="border-t border-gray-light">
                  <td className="px-sm py-sm">
                    <input
                      type="checkbox"
                      checked={trade.includeInDti}
                      disabled={readOnly}
                      onChange={(event) =>
                        onChange({
                          debtTrades: application.debtTrades.map((item) =>
                            item.id === trade.id
                              ? { ...item, includeInDti: event.target.checked }
                              : item,
                          ),
                        })
                      }
                    />
                  </td>
                  <td className="px-sm py-sm">{trade.lender}</td>
                  <td className="px-sm py-sm">{trade.category}</td>
                  <td className="px-sm py-sm">
                    <NumberField
                      compact
                      value={trade.balance}
                      readOnly={readOnly}
                      onChange={(balance) =>
                        onChange({
                          debtTrades: application.debtTrades.map((item) =>
                            item.id === trade.id ? { ...item, balance } : item,
                          ),
                        })
                      }
                    />
                  </td>
                  <td className="px-sm py-sm">
                    <NumberField
                      compact
                      value={trade.payment}
                      readOnly={readOnly}
                      onChange={(payment) =>
                        onChange({
                          debtTrades: application.debtTrades.map((item) =>
                            item.id === trade.id ? { ...item, payment } : item,
                          ),
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="uw-card-pad">
        <h2 className="text-sm font-semibold text-navy">Calculation</h2>
        <NumberField
          label="Est. new loan payment"
          value={application.income.estimatedNewPayment}
          readOnly={readOnly}
          source="proposed terms"
          onChange={(estimatedNewPayment) =>
            onChange({
              income: { ...application.income, estimatedNewPayment },
            })
          }
        />
        <dl className="mt-md space-y-sm border-t border-gray-light pt-md text-sm">
          <CalcRow label="New student loan payment" value={money(calc.estimatedNewPayment)} />
          <CalcRow label="Other monthly obligations" value={money(calc.remainingMonthlyDebt)} />
          <CalcRow label="Housing" value={money(calc.housingPayment)} />
          <CalcRow label="Borrower monthly debt" value={money(calc.qualifyingMonthlyDebt)} total />
          <CalcRow label="Monthly income" value={money(calc.monthlyIncome)} />
          <CalcRow label="Debt to income" value={percent(calc.dti)} total />
        </dl>
      </section>

      <FlagList flags={stepFlags(application, "dti")} />
    </div>
  );
}

function CalcRow({
  label,
  value,
  total,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-md ${total ? "border-t border-gray-light pt-sm font-semibold" : ""}`}>
      <dt className="text-gray-dark">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
