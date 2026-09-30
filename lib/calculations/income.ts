import type {
  IncomeCalculator,
  IncomeFrequency,
  IncomeWorksheet,
  NursingCalculator,
  SelfEmployedCalculator,
} from "../types";

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

export function emptyNursing(): NursingCalculator {
  return {
    hospitalYtd: 0,
    hospitalYtdMonths: 0,
    hospitalPriorYear: 0,
    hospitalIncluded: false,
    agencyYtd: 0,
    agencyYtdMonths: 0,
    agencyPriorYear: 0,
    agencyIncluded: false,
    prnYtd: 0,
    prnYtdMonths: 0,
    prnPriorYear: 0,
    prnIncluded: false,
    stipendYtd: 0,
    stipendYtdMonths: 0,
  };
}

export function hydrateNursing(income: IncomeWorksheet): NursingCalculator {
  return { ...emptyNursing(), ...income.nursing };
}

export interface NursingSource {
  priorMonthly: number;
  ytdMonthly: number | null;
  qualifyingMonthly: number;
}

function nursingSource(ytd: number, ytdMonths: number, priorYear: number): NursingSource {
  const priorMonthly = priorYear / 12;
  const ytdMonthly = ytdMonths > 0 ? ytd / ytdMonths : null;
  const qualifyingMonthly =
    ytdMonthly == null ? priorMonthly : priorMonthly ? Math.min(priorMonthly, ytdMonthly) : ytdMonthly;
  return { priorMonthly, ytdMonthly, qualifyingMonthly };
}

export interface NursingBreakdown {
  hospital: NursingSource;
  agency: NursingSource;
  prn: NursingSource;
  stipendMonthly: number | null;
  qualifyingMonthly: number;
}

export function nursingBreakdown(calc: NursingCalculator): NursingBreakdown {
  const hospital = nursingSource(calc.hospitalYtd, calc.hospitalYtdMonths, calc.hospitalPriorYear);
  const agency = nursingSource(calc.agencyYtd, calc.agencyYtdMonths, calc.agencyPriorYear);
  const prn = nursingSource(calc.prnYtd, calc.prnYtdMonths, calc.prnPriorYear);
  const stipendMonthly = calc.stipendYtdMonths > 0 ? calc.stipendYtd / calc.stipendYtdMonths : null;
  const qualifyingMonthly =
    (calc.hospitalIncluded ? hospital.qualifyingMonthly : 0) +
    (calc.agencyIncluded ? agency.qualifyingMonthly : 0) +
    (calc.prnIncluded ? prn.qualifyingMonthly : 0);
  return { hospital, agency, prn, stipendMonthly, qualifyingMonthly };
}

export function emptySelfEmployed(): SelfEmployedCalculator {
  return {
    currentNet: 0,
    currentDepreciation: 0,
    currentHomeUse: 0,
    currentDepletionAmortization: 0,
    currentOtherAddbacks: 0,
    currentNonRecurringIncome: 0,
    priorNet: 0,
    priorDepreciation: 0,
    priorHomeUse: 0,
    priorDepletionAmortization: 0,
    priorOtherAddbacks: 0,
    priorNonRecurringIncome: 0,
    ytdNet: 0,
    ytdAddbacks: 0,
    ytdMonths: 0,
  };
}

export function hydrateSelfEmployed(income: IncomeWorksheet): SelfEmployedCalculator {
  return { ...emptySelfEmployed(), ...income.selfEmployed };
}

export type SelfEmployedMethod = "average" | "lower-year" | "ytd-cap" | "single" | "none";

export interface SelfEmployedBreakdown {
  currentAdjusted: number;
  currentMonthly: number;
  priorAdjusted: number;
  priorMonthly: number;
  qualifyingAnnual: number;
  qualifyingMonthly: number;
  method: SelfEmployedMethod;
  ytdMonthly: number | null;
}

export function selfEmployedBreakdown(calc: SelfEmployedCalculator): SelfEmployedBreakdown {
  const currentAdjusted =
    calc.currentNet +
    calc.currentDepreciation +
    calc.currentHomeUse +
    calc.currentDepletionAmortization +
    calc.currentOtherAddbacks -
    calc.currentNonRecurringIncome;
  const priorAdjusted =
    calc.priorNet +
    calc.priorDepreciation +
    calc.priorHomeUse +
    calc.priorDepletionAmortization +
    calc.priorOtherAddbacks -
    calc.priorNonRecurringIncome;
  const currentEntered = currentAdjusted !== 0;
  const priorEntered = priorAdjusted !== 0;
  let method: SelfEmployedMethod = "none";
  let qualifyingAnnual = 0;
  if (currentEntered && priorEntered) {
    if (currentAdjusted < priorAdjusted) {
      method = "lower-year";
      qualifyingAnnual = currentAdjusted;
    } else {
      method = "average";
      qualifyingAnnual = (currentAdjusted + priorAdjusted) / 2;
    }
  } else if (currentEntered || priorEntered) {
    method = "single";
    qualifyingAnnual = currentEntered ? currentAdjusted : priorAdjusted;
  }
  const ytdMonthly = calc.ytdMonths > 0 ? (calc.ytdNet + calc.ytdAddbacks) / calc.ytdMonths : null;
  if (ytdMonthly != null && ytdMonthly < qualifyingAnnual / 12) {
    qualifyingAnnual = ytdMonthly * 12;
    method = "ytd-cap";
  }
  return {
    currentAdjusted,
    currentMonthly: currentAdjusted / 12,
    priorAdjusted,
    priorMonthly: priorAdjusted / 12,
    qualifyingAnnual,
    qualifyingMonthly: qualifyingAnnual / 12,
    method,
    ytdMonthly,
  };
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
