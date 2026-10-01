"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { opsSeed } from "./ops-data";
import { statusAfterAmounts } from "./ops-logic";
import type { CaseStatus, Disbursement, OpsProduct, OpsState, SchoolResponse, ServicingLoan } from "./ops-types";

const STORAGE_KEY = "fd-ops-v1";
const SERVER_SNAPSHOT = opsSeed;

type Listener = () => void;
const listeners = new Set<Listener>();
let state: OpsState = opsSeed;
let clientHydrated = false;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: OpsState) {
  state = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function isOpsState(value: unknown): value is OpsState {
  if (!value || typeof value !== "object") return false;
  const record = value as OpsState;
  return Array.isArray(record.certifications) && Array.isArray(record.loans) && Array.isArray(record.cases);
}

function loadState(): OpsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(opsSeed);
    const parsed = JSON.parse(raw) as unknown;
    if (!isOpsState(parsed) || parsed.certifications.length === 0) return clone(opsSeed);
    return mergeOpsSeed(parsed);
  } catch {
    return clone(opsSeed);
  }
}

function asProduct(value: string): OpsProduct {
  if (value === "InSchool" || value === "ReFi" || value === "EdMed") return value;
  if (value === "In-School") return "InSchool";
  if (value === "Tavant") return "ReFi";
  return "InSchool";
}

function mergeOpsSeed(saved: OpsState): OpsState {
  const certifications = saved.certifications.map((item) => ({ ...item, product: asProduct(item.product) }));
  const loans = saved.loans.map((item) => ({ ...item, product: asProduct(item.product) }));
  const certIds = new Set(certifications.map((item) => item.id));
  const loanIds = new Set(loans.map((item) => item.id));
  const caseIds = new Set(saved.cases.map((item) => item.id));
  return {
    certifications: [...certifications, ...opsSeed.certifications.filter((item) => !certIds.has(item.id))],
    loans: [...loans, ...opsSeed.loans.filter((item) => !loanIds.has(item.id))],
    cases: [...saved.cases, ...opsSeed.cases.filter((item) => !caseIds.has(item.id))],
  };
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!clientHydrated) {
    state = loadState();
    clientHydrated = true;
  }
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function edit(recipe: (current: OpsState) => void) {
  const next = clone(state);
  recipe(next);
  persist(next);
}

function loanByCertification(current: OpsState, certificationId: string) {
  return current.loans.find((loan) => loan.certificationId === certificationId) ?? null;
}

export interface OpsStore {
  certifications: OpsState["certifications"];
  loans: OpsState["loans"];
  cases: OpsState["cases"];
  recordSchoolResponse: (id: string, response: SchoolResponse) => void;
  resendCertification: (id: string) => void;
  rejectCertification: (id: string) => void;
  editSchoolCode: (certificationId: string, schoolCode: string) => void;
  updateDisbursement: (loanId: string, disbursementId: string, amount: number) => void;
  markDisbursed: (loanId: string, disbursementId: string) => void;
  reassignCase: (id: string, assignee: string) => void;
  resolveCase: (id: string) => void;
  saveCaseNotes: (id: string, notes: string) => void;
}

const OpsContext = createContext<OpsStore | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<OpsStore>(() => {
    return {
      certifications: snapshot.certifications,
      loans: snapshot.loans,
      cases: snapshot.cases,
      recordSchoolResponse: (id, response) => {
        edit((current) => {
          const cert = current.certifications.find((item) => item.id === id);
          if (!cert) return;
          const kept = cert.disbursements.filter((item) => item.status === "disbursed");
          const keptIds = new Set(kept.map((item) => item.id));
          const incoming: Disbursement[] = response.disbursements
            .filter((item) => item.date && item.amount > 0 && !(item.id && keptIds.has(item.id)))
            .map((item, index) => ({
              id: item.id && !keptIds.has(item.id) ? item.id : `d-${id}-${Date.now().toString(36)}-${index}`,
              date: item.date.includes("T") ? item.date : `${item.date}T12:00:00`,
              amount: item.amount,
              status: "scheduled" as const,
            }));
          cert.enrollment = response.enrollment;
          cert.certifiedAmount = response.certifiedAmount;
          cert.costOfAttendance = response.costOfAttendance;
          cert.certifiedAt = new Date().toISOString();
          cert.status = statusAfterAmounts(response.certifiedAmount, cert.approvedAmount);
          cert.disbursements = [...kept, ...incoming];
        });
      },
      resendCertification: (id) => {
        edit((current) => {
          const cert = current.certifications.find((item) => item.id === id);
          if (!cert) return;
          cert.status = "requested";
          cert.requestedAt = new Date().toISOString();
        });
      },
      rejectCertification: (id) => {
        edit((current) => {
          const cert = current.certifications.find((item) => item.id === id);
          if (!cert || cert.status === "rejected") return;
          cert.status = "rejected";
        });
      },
      editSchoolCode: (certificationId, schoolCode) => {
        const code = schoolCode.trim();
        if (!code) return;
        edit((current) => {
          const cert = current.certifications.find((item) => item.id === certificationId);
          if (cert) cert.schoolCode = code;
          const loan = loanByCertification(current, certificationId);
          if (loan && !loan.readOnly) loan.schoolCode = code;
        });
      },
      updateDisbursement: (loanId, disbursementId, amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        edit((current) => {
          const target = disbursementTarget(current, loanId);
          if (!target || target.loan.readOnly) return;
          const line = target.disbursements.find((item) => item.id === disbursementId);
          if (!line || line.status !== "scheduled") return;
          line.amount = amount;
        });
      },
      markDisbursed: (loanId, disbursementId) => {
        edit((current) => {
          const target = disbursementTarget(current, loanId);
          if (!target || target.loan.readOnly) return;
          const line = target.disbursements.find((item) => item.id === disbursementId);
          if (!line || line.status !== "scheduled") return;
          line.status = "disbursed";
          target.loan.principal = round2(target.loan.principal + line.amount);
        });
      },
      reassignCase: (id, assignee) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item || item.status === "resolved") return;
          item.assignee = assignee;
          if (item.status === "open") item.status = "waiting-on-advisor";
        });
      },
      resolveCase: (id) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item) return;
          item.status = "resolved" satisfies CaseStatus;
        });
      },
      saveCaseNotes: (id, notes) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item) return;
          item.notes = notes;
        });
      },
    };
  }, [snapshot]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

function disbursementTarget(current: OpsState, loanId: string): { loan: ServicingLoan; disbursements: Disbursement[] } | null {
  const loan = current.loans.find((item) => item.id === loanId);
  if (!loan) return null;
  if (loan.certificationId) {
    const cert = current.certifications.find((item) => item.id === loan.certificationId);
    if (!cert) return null;
    return { loan, disbursements: cert.disbursements };
  }
  return { loan, disbursements: loan.disbursements };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function useOps() {
  const value = useContext(OpsContext);
  if (!value) throw new Error("useOps must be used within OpsProvider");
  return value;
}
