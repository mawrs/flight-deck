import type { IncomeCalculator, IncomeFrequency, IncomeWorksheet } from "../types";

export function emptyCalculator(): IncomeCalculator {
  return {
    annual: 0,
    monthly: 0,
    semiMonthly: 0,
    biweekly: 0,
    weekly: 0,
    hourlyRate: 0,
    hourlyHours: 0,
    ytdGross: 0,
    ytdPeriods: 0,
    ytdAnnualPeriods: 0,
    yearCurrent: 0,
    yearPrior: 0,
  };
}

export function seedCalculator(
  income: Omit<IncomeWorksheet, "calculator"> & { calculator?: IncomeCalculator },
): IncomeCalculator {
  const next = emptyCalculator();
  switch (income.selectedFrequency) {
    case "annual":
      next.annual = income.grossPay;
      break;
    case "monthly":
      next.monthly = income.grossPay;
      break;
    case "semi-monthly":
      next.semiMonthly = income.grossPay;
      break;
    case "biweekly":
      next.biweekly = income.grossPay;
      break;
    case "weekly":
      next.weekly = income.grossPay;
      break;
    case "hourly":
      next.hourlyRate = income.grossPay;
      next.hourlyHours = income.hours || 0;
      break;
    case "ytd":
      next.ytdGross = income.grossPay;
      next.ytdPeriods = income.payPeriods || 0;
      break;
  }
  next.yearPrior = income.priorYearIncome || 0;
  return next;
}

export function hydrateCalculator(income: IncomeWorksheet): IncomeCalculator {
  return income.calculator ?? seedCalculator(income);
}

export function monthlyFromFrequency(
  frequency: IncomeFrequency,
  grossPay: number,
  hours = 0,
  payPeriods = 0,
  annualPeriods = 26,
): number {
  if (!grossPay) return 0;

  switch (frequency) {
    case "annual":
      return grossPay / 12;
    case "monthly":
      return grossPay;
    case "semi-monthly":
      return (grossPay * 24) / 12;
    case "biweekly":
      return (grossPay * 26) / 12;
    case "weekly":
      return (grossPay * 52) / 12;
    case "hourly":
      return (grossPay * hours * 52) / 12;
    case "ytd":
      if (!payPeriods || !annualPeriods) return 0;
      return ((grossPay / payPeriods) * annualPeriods) / 12;
    default:
      return 0;
  }
}

export function monthlyIncome(income: IncomeWorksheet): {
  base: number;
  variable: number;
  total: number;
  annualized: number;
} {
  const base = monthlyFromFrequency(
    income.selectedFrequency,
    income.grossPay,
    income.hours,
    income.payPeriods,
    income.calculator?.ytdAnnualPeriods || 26,
  );
  const variable = income.variablePayPeriods
    ? income.variableYtd / income.variablePayPeriods
    : 0;
  const total = base + variable;
  return { base, variable, total, annualized: total * 12 };
}

export function estimatedPayment(
  amount: number,
  termMonths: number,
  annualRate = 0.075,
): number {
  if (!amount || !termMonths) return 0;
  const r = annualRate / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
}
