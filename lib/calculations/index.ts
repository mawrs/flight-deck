import type { Application, CalculationResult, Liability } from "../types";
import { estimatedPayment, monthlyIncome } from "./income";

export function payoffDiscrepancy(liability: Liability): boolean {
  const nameDiff =
    liability.adjCreditorName.trim().toUpperCase() !==
    liability.lender.trim().toUpperCase();
  const accountDiff =
    liability.adjAccountNumber.replace(/\s/g, "") !==
    liability.accountNumber.replace(/\s/g, "");
  const balanceDiff = Math.abs(liability.adjBalance - liability.balance) >= 1;
  return nameDiff || accountDiff || balanceDiff;
}

export function selectedPayoffTotal(liabilities: Liability[]): number {
  return liabilities
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + (item.adjBalance || 0), 0);
}

export function remainingMonthlyDebt(application: Application): number {
  const paidOffIds = new Set(
    application.liabilities.filter((item) => item.selected).map((item) => item.id),
  );
  return application.debtTrades
    .filter((trade) => trade.includeInDti && !paidOffIds.has(trade.id))
    .reduce((sum, trade) => sum + ((trade.adjPayment ?? trade.payment) || 0), 0);
}

export function calculate(application: Application): CalculationResult {
  const income = monthlyIncome(application.income);
  const selected = application.liabilities.filter((item) => item.selected);
  const remaining = remainingMonthlyDebt(application);
  const housing = application.income.housingPayment || 0;
  const newPayment =
    application.income.estimatedNewPayment ||
    estimatedPayment(application.amount, application.requestedTerm);
  const borrowerDebt = remaining + housing;
  const qualifying = borrowerDebt + newPayment;
  const dti = income.total > 0 ? qualifying / income.total : null;

  return {
    monthlyBaseIncome: round(income.base),
    monthlyVariableIncome: round(income.variable),
    monthlyIncome: round(income.total),
    annualizedIncome: round(income.annualized),
    selectedPayoffTotal: round(selectedPayoffTotal(application.liabilities)),
    remainingMonthlyDebt: round(remaining),
    housingPayment: round(housing),
    borrowerDebt: round(borrowerDebt),
    estimatedNewPayment: round(newPayment),
    qualifyingMonthlyDebt: round(qualifying),
    dti,
    selectedCount: selected.length,
    discrepancyCount: selected.filter(payoffDiscrepancy).length,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
