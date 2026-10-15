import { paymentFor, rateFor, type RateKind, type RateProduct, type RateTerm } from "./calculations/rates";
import { money, percent } from "./format";
import { opsSeed } from "./ops-data";
import type { Application, DisbursementHistoryLine, RateHistoryEntry } from "./types";

function noon(date: string) {
  return `${date}T12:00:00`;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function line(
  id: string,
  date: string,
  amount: number,
  status: DisbursementHistoryLine["status"],
  updated: string,
): DisbursementHistoryLine {
  return {
    id,
    date: noon(date),
    amount: String(round2(amount)),
    status,
    statusUpdatedAt: noon(updated),
  };
}

function rate(
  app: Application,
  product: RateProduct,
  rateType: RateKind,
  term: RateTerm,
  at: string,
): RateHistoryEntry {
  const apr = rateFor(rateType, term);
  const payment = paymentFor(app, rateType, term, product);
  return {
    id: `seed-rate-${app.id}-${at}`,
    at: noon(at),
    product,
    rateType,
    term,
    rate: apr == null ? "—" : percent(apr),
    payment: payment == null ? "—" : money(payment),
  };
}

function loanFile(loanId: string, app: Application) {
  const loan = opsSeed.loans.find((item) => item.id === loanId);
  const cert = loan?.certificationId
    ? opsSeed.certifications.find((item) => item.id === loan.certificationId)
    : undefined;
  const certified = cert?.certifiedAmount ?? loan?.principal ?? app.amount;
  const approved = cert?.approvedAmount ?? certified;
  const payoff = loan && loan.principal > 0 ? loan.principal : approved;
  return { certified, approved, payoff };
}

function disbursementsFor(loanId: string, app: Application): DisbursementHistoryLine[] {
  const { certified, approved, payoff } = loanFile(loanId, app);
  const half = round2(certified / 2);

  switch (loanId) {
    case "loan-5001":
      return [
        line(`${loanId}-1`, "2026-08-20", half, "CANCELLED", "2026-09-02"),
        line(`${loanId}-2`, "2026-09-18", half, "SCHEDULED", "2026-09-18"),
        line(`${loanId}-3`, "2027-01-15", round2(certified - half), "SCHEDULED", "2026-09-01"),
      ];
    case "loan-5002":
      return [
        line(`${loanId}-1`, "2026-09-02", half, "CANCELLED", "2026-09-30"),
        line(`${loanId}-2`, "2026-10-01", round2(half * 0.67), "SCHEDULED", "2026-09-30"),
        line(`${loanId}-3`, "2027-01-20", round2(half * 0.33), "SCHEDULED", "2026-09-30"),
        line(`${loanId}-4`, "2027-02-02", half, "SCHEDULED", "2026-09-12"),
      ];
    case "loan-5003":
      return [
        line(`${loanId}-1`, "2026-09-15", round2(approved / 2), "CANCELLED", "2026-09-11"),
        line(`${loanId}-2`, "2026-11-16", half, "SCHEDULED", "2026-09-11"),
        line(`${loanId}-3`, "2027-01-12", round2(certified - half), "SCHEDULED", "2026-09-11"),
      ];
    case "loan-5004":
      return [
        line(`${loanId}-1`, "2026-09-08", round2(approved / 2), "CANCELLED", "2026-08-22"),
        line(`${loanId}-2`, "2026-09-08", half, "SCHEDULED", "2026-09-08"),
        line(`${loanId}-3`, "2027-01-06", round2(certified - half), "SCHEDULED", "2026-08-22"),
      ];
    case "loan-5005":
      return [
        line(`${loanId}-1`, "2026-08-18", round2(certified * 0.25), "CANCELLED", "2026-08-29"),
        line(`${loanId}-2`, "2026-12-04", half, "SCHEDULED", "2026-08-29"),
        line(`${loanId}-3`, "2027-01-15", half, "SCHEDULED", "2026-08-29"),
      ];
    case "loan-5006":
      return [
        line(`${loanId}-1`, "2026-08-15", half, "DISBURSED", "2026-08-18"),
        line(`${loanId}-2`, "2026-09-02", half, "CANCELLED", "2026-09-22"),
        line(`${loanId}-3`, "2026-10-15", half, "SCHEDULED", "2026-09-22"),
      ];
    case "loan-5007":
      return [
        line(`${loanId}-1`, "2026-09-02", half, "CANCELLED", "2026-09-14"),
        line(`${loanId}-2`, "2026-09-28", half, "SCHEDULED", "2026-09-28"),
        line(`${loanId}-3`, "2027-01-20", half, "SCHEDULED", "2026-09-14"),
      ];
    case "loan-5008":
      return [line(`${loanId}-1`, "2026-09-12", payoff, "DISBURSED", "2026-09-12")];
    case "loan-5009":
      return [
        line(`${loanId}-1`, "2026-09-04", round2(payoff * 0.92), "CANCELLED", "2026-09-18"),
        line(`${loanId}-2`, "2026-09-20", payoff, "DISBURSED", "2026-09-20"),
      ];
    case "loan-5010":
      return [line(`${loanId}-1`, "2026-09-30", payoff, "SCHEDULED", "2026-09-22")];
    case "loan-5011":
      return [
        line(`${loanId}-1`, "2026-09-20", payoff, "CANCELLED", "2026-09-20"),
        line(`${loanId}-2`, "2026-10-06", payoff, "SCHEDULED", "2026-10-06"),
      ];
    default:
      return [];
  }
}

function ratesFor(loanId: string, app: Application): RateHistoryEntry[] {
  switch (loanId) {
    case "loan-5001":
    case "loan-5005":
      return [
        rate(app, "deferred", "Fixed", 180, "2026-08-12"),
        rate(app, "immediate", "Fixed", 120, "2026-09-01"),
      ].reverse();
    case "loan-5003":
    case "loan-5007":
      return [
        rate(app, "interest-only", "Variable", 120, "2026-08-20"),
        rate(app, "deferred", "Fixed", 180, "2026-09-14"),
      ].reverse();
    case "loan-5002":
    case "loan-5004":
      return [
        rate(app, "deferred", "Variable", 180, "2026-08-22"),
        rate(app, "interest-only", "Fixed", 180, "2026-09-12"),
      ].reverse();
    case "loan-5006":
      return [
        rate(app, "deferred", "Fixed", 180, "2026-08-06"),
        rate(app, "interest-only", "Variable", 120, "2026-09-22"),
      ].reverse();
    case "loan-5008":
      return [rate(app, "immediate", "Fixed", 60, "2026-09-12")];
    case "loan-5009":
      return [
        rate(app, "immediate", "Variable", 84, "2026-09-04"),
        rate(app, "immediate", "Fixed", 120, "2026-09-18"),
      ].reverse();
    case "loan-5010":
      return [rate(app, "immediate", "Fixed", 84, "2026-09-22")];
    case "loan-5011":
      return [
        rate(app, "immediate", "Fixed", 120, "2026-08-18"),
        rate(app, "immediate", "Fixed", 84, "2026-09-20"),
      ].reverse();
    default:
      return [];
  }
}

export function withFileHistory(apps: Application[]): Application[] {
  return apps.map((app) => {
    if (app.disbursementHistory.length > 0 && app.rateHistory.length > 0) return app;
    const loan = opsSeed.loans.find((item) => item.applicationId === app.id);
    if (!loan) return app;
    return {
      ...app,
      disbursementHistory: app.disbursementHistory.length ? app.disbursementHistory : disbursementsFor(loan.id, app),
      rateHistory: app.rateHistory.length ? app.rateHistory : ratesFor(loan.id, app),
    };
  });
}
