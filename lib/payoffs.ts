import type { Liability } from "./types";

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
