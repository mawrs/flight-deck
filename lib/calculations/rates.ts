import { estimatedPayment, monthlyIncome } from "./income";
import type { Application } from "../types";

export const RATE_TERMS = [60, 84, 120, 180, 240] as const;
export type RateTerm = (typeof RATE_TERMS)[number];
export type RateKind = "Fixed" | "Variable";

export const OFFER_TERMS = [
  { years: 5, months: 60 },
  { years: 7, months: 84 },
  { years: 10, months: 120 },
  { years: 15, months: 180 },
] as const;

export type RateProduct = "immediate" | "fixed" | "interest-only" | "deferred";

const FIXED_RATES: Record<RateTerm, number | null> = {
  60: 0.092,
  84: 0.0948,
  120: 0.0849,
  180: 0.0864,
  240: null,
};

const VARIABLE_RATES: Record<RateTerm, number | null> = {
  60: 0.0886,
  84: 0.0949,
  120: 0.0882,
  180: 0.0916,
  240: null,
};

const VARIABLE_MARGIN: Record<RateTerm, number | null> = {
  60: 0.0161,
  84: 0.0224,
  120: 0.0157,
  180: 0.0191,
  240: null,
};

const OFFER_APR: Record<RateKind, Record<number, number>> = {
  Fixed: { 60: 0.0639, 84: 0.0643, 120: 0.0645, 180: 0.0645 },
  Variable: { 60: 0.0639, 84: 0.0643, 120: 0.0645, 180: 0.0645 },
};

export function rateFor(kind: RateKind, term: RateTerm) {
  return kind === "Fixed" ? FIXED_RATES[term] : VARIABLE_RATES[term];
}

export function marginFor(term: RateTerm) {
  return VARIABLE_MARGIN[term];
}

export function offerApr(kind: RateKind, months: number) {
  return OFFER_APR[kind][months] ?? null;
}

export function paymentFor(
  application: Application,
  kind: RateKind,
  term: RateTerm,
  product: RateProduct = "immediate",
) {
  const rate = rateFor(kind, term);
  if (rate == null) return null;
  if (product === "deferred") return 0;
  if (product === "interest-only") return round2((application.amount * rate) / 12);
  return round2(estimatedPayment(application.amount, term, rate));
}

export function offerPayment(
  application: Application,
  kind: RateKind,
  months: number,
  product: RateProduct,
) {
  const apr = offerApr(kind, months);
  if (apr == null) return null;
  if (product === "deferred") return 0;
  if (product === "interest-only") return round2((application.amount * apr) / 12);
  return round2(estimatedPayment(application.amount, months, apr));
}

export function offerTotals(payment: number | null, months: number, principal: number) {
  if (payment == null) return { total: null, interest: null };
  const total = Math.round(payment * months);
  const interest = Math.max(0, total - Math.round(principal));
  return { total, interest };
}

export function remainingDebt(application: Application) {
  const paidOffIds = new Set(
    application.liabilities.filter((item) => item.selected).map((item) => item.id),
  );
  return application.debtTrades
    .filter((trade) => trade.includeInDti && !paidOffIds.has(trade.id))
    .reduce((sum, trade) => sum + ((trade.adjPayment ?? trade.payment) || 0), 0);
}

export function liabilitiesForPayment(application: Application, payment: number | null) {
  if (payment == null) return null;
  return remainingDebt(application) + (application.income.housingPayment || 0) + payment;
}

export function dtiForPayment(application: Application, payment: number | null) {
  if (payment == null) return null;
  const income = monthlyIncome(application.income).total;
  if (!income) return null;
  return liabilitiesForPayment(application, payment)! / income;
}

export function formatGridValue(value: number | null, digits = 2) {
  if (value == null) return "-";
  return Number(value.toFixed(digits)).toString();
}

export function formatGridRate(rate: number | null) {
  if (rate == null) return "-";
  return formatGridValue(rate * 100);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
