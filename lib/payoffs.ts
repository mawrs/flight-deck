import type { Application, ApplicationPatch, DebtTrade, Liability } from "./types";

const LENDER_ADDRESSES: Record<string, string[]> = {
  "SALLIE MAE": [
    "PO Box 8459 Philadelphia, Pennsylvania 19101",
    "300 Continental Drive Newark, Delaware 19713",
    "PO Box 9500 Wilkes-Barre, Pennsylvania 18773",
  ],
  "LAKESHORE STUDENT AID": [
    "PO Box 2100 Chicago, Illinois 60690",
    "200 E Randolph Street Chicago, Illinois 60601",
  ],
  "HARBOR STUDENT LENDING": [
    "PO Box 4412 Boston, Massachusetts 02101",
    "100 Federal Street Boston, Massachusetts 02110",
  ],
};

export function isStudentLoan(item: Liability) {
  return item.category === "EDUCATIONAL";
}

export function defaultLenderAddresses(lender: string) {
  return LENDER_ADDRESSES[lender.trim().toUpperCase()] ?? [];
}

export function lenderAddressOptions(lender: string, extra: string[] = []) {
  const key = lender.trim().toUpperCase();
  const own = LENDER_ADDRESSES[key] ?? [];
  const rest = Object.entries(LENDER_ADDRESSES)
    .filter(([name]) => name !== key)
    .flatMap(([, addresses]) => addresses);
  const seen = new Set<string>();
  return [...own, ...extra, ...rest].filter((address) => {
    const next = address.trim();
    if (!next || seen.has(next)) return false;
    seen.add(next);
    return true;
  });
}

export function normalizeLiability(item: Liability): Liability {
  const addresses =
    item.lenderAddresses?.length > 0 ? item.lenderAddresses : defaultLenderAddresses(item.lender);
  return {
    ...item,
    adjLoanIdentifier: item.adjLoanIdentifier ?? "",
    lenderAddresses: addresses,
    selectedAddress: item.selectedAddress || addresses[0] || "",
  };
}

export function loansForPayoff(application: Application): Liability[] {
  const saved = new Map((application.payoffs ?? []).map((item) => [item.id, item]));
  const credit = application.debtTrades
    .filter((trade) => trade.includeInDti)
    .map((trade) => payoffFromTrade(trade, saved.get(trade.id)));
  const student = application.liabilities
    .filter((item) => isStudentLoan(item) && item.selected)
    .map(normalizeLiability);
  return [...credit, ...student];
}

export function patchPayoffLoan(
  application: Application,
  loanId: string,
  patch: Partial<Liability>,
): ApplicationPatch {
  const trade = application.debtTrades.find((item) => item.id === loanId);
  if (trade) {
    if (patch.selected === false) {
      return {
        debtTrades: application.debtTrades.map((item) =>
          item.id === loanId ? { ...item, includeInDti: false } : item,
        ),
        payoffs: (application.payoffs ?? []).filter((item) => item.id !== loanId),
      };
    }
    const current = payoffFromTrade(
      trade,
      (application.payoffs ?? []).find((item) => item.id === loanId),
    );
    const next = normalizeLiability({ ...current, ...patch, id: loanId, selected: true });
    return {
      payoffs: [...(application.payoffs ?? []).filter((item) => item.id !== loanId), next],
    };
  }

  return {
    liabilities: application.liabilities.map((item) =>
      item.id === loanId ? normalizeLiability({ ...item, ...patch }) : item,
    ),
  };
}

function payoffFromTrade(trade: DebtTrade, saved?: Liability): Liability {
  return normalizeLiability({
    id: trade.id,
    lender: trade.lender,
    accountNumber: trade.accountNumber,
    loanIdentifier: saved?.loanIdentifier ?? "",
    category: trade.category,
    accountType: trade.accountType,
    highCredit: trade.highCredit,
    balance: trade.balance,
    payment: trade.payment,
    selected: true,
    payoffType: saved?.payoffType ?? "full",
    adjCreditorName: saved?.adjCreditorName ?? "",
    adjAccountNumber: saved?.adjAccountNumber ?? "",
    adjLoanIdentifier: saved?.adjLoanIdentifier ?? "",
    adjBalance: saved?.adjBalance ?? 0,
    source: "credit-report",
    confirmed: saved?.confirmed ?? false,
    lenderAddresses: saved?.lenderAddresses?.length
      ? saved.lenderAddresses
      : defaultLenderAddresses(trade.lender),
    selectedAddress: saved?.selectedAddress ?? "",
  });
}

export function emptyStudentLoan(): Liability {
  return emptyLoan({ selected: true });
}

export function emptyPayoffLoan(): Liability {
  return emptyLoan({ selected: false });
}

function emptyLoan(partial: Partial<Liability>): Liability {
  return {
    id: `manual-${Date.now()}`,
    lender: "",
    accountNumber: "",
    loanIdentifier: "",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 0,
    balance: 0,
    payment: 0,
    selected: true,
    payoffType: "full",
    adjCreditorName: "",
    adjAccountNumber: "",
    adjLoanIdentifier: "",
    adjBalance: 0,
    source: "manual",
    confirmed: false,
    lenderAddresses: [],
    selectedAddress: "",
    ...partial,
  };
}
