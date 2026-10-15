"use client";

import { useSyncExternalStore } from "react";

export type ChangeValueField = "previous" | "next" | "requested";

export interface ChangeTransaction {
  id: string;
  ssn: string;
  lastName: string;
  firstName: string;
  clUniqueId: string;
  changeDate: string;
  action: string;
  field: string;
  previous: string;
  next: string;
  requested: string;
}

const BORROWER = {
  ssn: "045-11-3235",
  lastName: "RIVERS",
  firstName: "DARCY",
  clUniqueId: "83435100001407928",
  changeDate: "10/06/2026 7:14 AM",
};

function row(
  id: string,
  action: string,
  field: string,
  previous: string,
  next: string,
  requested = "$15,715.00",
): ChangeTransaction {
  return { id, ...BORROWER, action, field, previous, next, requested };
}

const LOAN = "School Request Loan Change";
const PARTIAL = "School Request Partial Cancellation";

export const CHANGE_TRANSACTIONS: ChangeTransaction[] = [
  row("ct-1", LOAN, "Certified Amount", "$15,715.00", "$8,543.00"),
  row("ct-2", PARTIAL, "Disbursement 1 Status", "Disbursed", "Partially Cancelled"),
  row("ct-3", PARTIAL, "Disbursement 1 Net Amount", "$4,271.00", ""),
  row("ct-4", PARTIAL, "Disbursement 1 Gross Amount", "$10,493.00", "$4,271.00"),
  row("ct-5", PARTIAL, "Disbursement 1 Net Amount", "$5,222.00", "$4,271.00"),
  row("ct-6", PARTIAL, "Disbursement 1 Reduced By", "$6,222.00", ""),
  row("ct-7", PARTIAL, "Disbursement 1 Consummated", "No", ""),
  row("ct-8", PARTIAL, "Disbursement 1 Refund Amount", "$6,222.00", ""),
  row("ct-9", PARTIAL, "Disbursement 1 Termination Reason", "Student Request", ""),
  row("ct-10", PARTIAL, "Disbursement 2 Net Amount", "$5,222.00", "$4,272.00"),
  row("ct-11", PARTIAL, "Disbursement 2 Gross Amount", "$5,222.00", "$4,272.00"),
  row("ct-12", PARTIAL, "Disbursement 2 Reduced By", "$950.00", ""),
  row("ct-13", PARTIAL, "Disbursement 2 Termination Reason", "Student Request", ""),
];

let transactions = CHANGE_TRANSACTIONS.map((item) => ({ ...item }));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function useChangeTransactions() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => transactions,
    () => transactions,
  );
}

export function updateChangeValue(id: string, field: ChangeValueField, value: string) {
  const current = transactions.find((item) => item.id === id);
  if (!current || current[field] === value) return null;
  const from = current[field];
  transactions = transactions.map((item) => (item.id === id ? { ...item, [field]: value } : item));
  emit();
  return { ...current, [field]: value, from };
}
