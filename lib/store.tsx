"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { calculate } from "./calculations";
import { hydrateCalculator } from "./calculations/income";
import { withFileHistory } from "./file-history";
import { seedApplications } from "./mock-data";
import { opsSeed } from "./ops-data";
import type {
  Application,
  ApplicationPatch,
  DebtTrade,
  Decision,
  Person,
  RecordType,
  Role,
  UnderwritingExtras,
} from "./types";

const STORAGE_KEY = "uw-prototype-v9";
const SERVER_SNAPSHOT = seedApplications;

type Listener = () => void;

const listeners = new Set<Listener>();
let state: Application[] = seedApplications;
let clientHydrated = false;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: Application[]) {
  state = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function hydratePerson(person: Person | null | undefined): Person | null {
  if (!person) return null;
  return {
    ...person,
    street: person.street ?? "",
    city: person.city ?? "",
    phone: person.phone ?? "",
    ssn: person.ssn ?? (person.ssnLast4 ? `478-21-${person.ssnLast4}` : ""),
    ssnLast4: person.ssnLast4 ?? "",
    citizenship: person.citizenship ?? "",
    graduationYear: person.graduationYear ?? "",
    relationship: person.relationship ?? "",
    livingArrangement: person.livingArrangement ?? "",
  };
}

function hydrateTrades(trades: DebtTrade[] | undefined, id: string): DebtTrade[] {
  const seeded = seedApplications.find((item) => item.id === id)?.debtTrades ?? [];
  if (!trades?.length) return clone(seeded);
  const isCreditFixture = trades.some((item) => item.lender === "EQUIFAX TEST DATA");
  if (!isCreditFixture && seeded.some((item) => item.lender === "EQUIFAX TEST DATA")) {
    return clone(seeded);
  }
  return trades.map((item) => ({
    ...item,
    sysPayment: item.sysPayment ?? item.payment,
    adjPayment: item.adjPayment ?? item.payment,
    originalBalance: item.originalBalance ?? item.highCredit,
    reportedAt: item.reportedAt ?? "",
    ecoa: item.ecoa ?? "",
  }));
}

function hydrateUnderwriting(
  extras: UnderwritingExtras | undefined,
  item: Pick<Application, "cosigner" | "stage">,
): UnderwritingExtras {
  return {
    borrowerStatus:
      extras?.borrowerStatus ??
      (item.cosigner ? "Awaiting CoSigner Completion" : item.stage || "Lead"),
    supervisorApproval: extras?.supervisorApproval ?? false,
    mlaEligible: extras?.mlaEligible ?? "no",
    primaryHousingTradeId: extras?.primaryHousingTradeId ?? "",
  };
}

function servicingLinks() {
  const loansWithCases = new Set(opsSeed.cases.map((item) => item.loanId));
  const latest = new Map<string, { product: Application["recordType"]; openedAt: string }>();
  for (const loan of opsSeed.loans) {
    if (!loan.applicationId || !loansWithCases.has(loan.id)) continue;
    const openedAt = opsSeed.cases
      .filter((item) => item.loanId === loan.id)
      .reduce((latestOpen, item) => (item.openedAt > latestOpen ? item.openedAt : latestOpen), "");
    const current = latest.get(loan.applicationId);
    if (!current || openedAt > current.openedAt) latest.set(loan.applicationId, { product: loan.product, openedAt });
  }
  return [...latest.entries()].sort((a, b) => b[1].openedAt.localeCompare(a[1].openedAt));
}

function syncServicingApplications(apps: Application[]) {
  const links = servicingLinks();
  const rank = new Map(links.map(([id], index) => [id, index]));
  const linked = new Map(links);
  return apps.map((app) => {
    const link = linked.get(app.id);
    if (!link) return app;
    const index = rank.get(app.id) ?? 0;
    const visible = app.status === "pre-review" || app.status === "needs-docs" || app.status === "returned";
    return {
      ...app,
      recordType: link.product,
      opportunity: app.opportunity ? { ...app.opportunity, recordType: link.product } : app.opportunity,
      status: visible ? app.status : "pre-review",
      stage: visible ? app.stage : "UW - PreReview",
      applicationDate: `2026-10-14T${String(18 - index).padStart(2, "0")}:00:00`,
    };
  });
}

function loadApplications(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return withFileHistory(syncServicingApplications(clone(seedApplications)));
    const parsed = JSON.parse(raw) as Application[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return clone(seedApplications);
    }
    const mapped = parsed.map((item) => ({
      ...item,
      recordType: normalizeRecordType(item.recordType),
      borrower: hydratePerson(item.borrower) ?? item.borrower,
      cosigner: hydratePerson(item.cosigner),
      workbookFileName: item.workbookFileName ?? null,
      workbookUploadedAt: item.workbookUploadedAt ?? null,
      workbookCopy: item.workbookCopy ?? null,
      opportunity: normalizeOpportunityType(item.opportunity),
      underwriting: hydrateUnderwriting(item.underwriting, item),
      fileReview: item.fileReview ?? null,
      cosignerStatus: item.cosignerStatus ?? (item.cosigner ? "On file" : ""),
      income: item.income
        ? { ...item.income, calculator: hydrateCalculator(item.income) }
        : item.income,
      debtTrades: hydrateTrades(item.debtTrades, item.id),
      fileNotes: item.fileNotes ?? "",
      fileNotesUpdatedAt: item.fileNotesUpdatedAt ?? null,
      disbursementHistory: Array.isArray(item.disbursementHistory) ? item.disbursementHistory : [],
      rateHistory: Array.isArray(item.rateHistory) ? item.rateHistory : [],
      payoffs: Array.isArray(item.payoffs)
        ? item.payoffs
        : clone(seedApplications.find((seed) => seed.id === item.id)?.payoffs ?? []),
    }));
    const typed = mapped.some((item) => item.recordType === "EdMed")
      ? mapped
      : mapped.map((item, index) =>
          index % 3 === 2
            ? {
                ...item,
                recordType: "EdMed" as const,
                opportunity: item.opportunity?.recordType
                  ? { ...item.opportunity, recordType: "EdMed" }
                  : item.opportunity,
              }
            : item,
        );
    return withFileHistory(syncServicingApplications(typed.filter((item) => !item.id.startsWith("180300"))));
  } catch {
    return withFileHistory(syncServicingApplications(clone(seedApplications)));
  }
}

function normalizeRecordType(value: string): RecordType {
  if (value === "ReFi" || value === "EdMed" || value === "InSchool") return value;
  if (value === "Tavant") return "ReFi";
  return "InSchool";
}

function normalizeOpportunityType(opportunity: Application["opportunity"]) {
  const next = opportunity ?? {};
  if (!next.recordType) return next;
  return { ...next, recordType: normalizeRecordType(next.recordType) };
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!clientHydrated) {
    state = loadApplications();
    clientHydrated = true;
  }
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

interface StoreValue {
  ready: boolean;
  role: Role;
  setRole: (role: Role) => void;
  applications: Application[];
  getApplication: (id: string) => Application | undefined;
  updateApplication: (id: string, patch: ApplicationPatch) => void;
  submitToSenior: (id: string) => boolean;
  completeSeniorReview: (id: string, decision: Decision) => boolean;
  resetStore: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const applications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [role, setRole] = useState<Role>("underwriter");

  const getApplication = useCallback(
    (id: string) => applications.find((item) => item.id === id),
    [applications],
  );

  const updateApplication = useCallback((id: string, patch: ApplicationPatch) => {
    state = state.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        ...patch,
        borrower: patch.borrower ?? item.borrower,
        cosigner: patch.cosigner !== undefined ? patch.cosigner : item.cosigner,
        employment: patch.employment ?? item.employment,
        income: patch.income ?? item.income,
        documents: patch.documents ?? item.documents,
        liabilities: patch.liabilities ?? item.liabilities,
        payoffs: patch.payoffs ?? item.payoffs,
        debtTrades: patch.debtTrades ?? item.debtTrades,
        notes: patch.notes ?? item.notes,
        workbookFileName: patch.workbookFileName ?? item.workbookFileName,
        workbookUploadedAt: patch.workbookUploadedAt ?? item.workbookUploadedAt,
        workbookCopy: patch.workbookCopy ?? item.workbookCopy,
        opportunity: patch.opportunity
          ? { ...item.opportunity, ...patch.opportunity }
          : item.opportunity,
        underwriting: patch.underwriting
          ? { ...item.underwriting, ...patch.underwriting }
          : item.underwriting,
        underwriter: patch.underwriter ?? item.underwriter,
        lastSavedAt: new Date().toISOString(),
      };
    });
    persist(state);
  }, []);

  const submitToSenior = useCallback((id: string) => {
    const current = state.find((item) => item.id === id);
    if (!current) return false;
    const now = new Date().toISOString();
    const snapshot = {
      submittedAt: now,
      submittedBy: current.underwriter,
      documents: clone(current.documents),
      liabilities: clone(current.liabilities),
      payoffs: clone(current.payoffs),
      income: clone(current.income),
      debtTrades: clone(current.debtTrades),
      notes: clone(current.notes),
      decision: current.decision,
      calculations: calculate(current),
    };
    persist(
      state.map((item) => {
        if (item.id !== id) return item;
        if (item.decision === "needs-docs") {
          return {
            ...item,
            status: "needs-docs" as const,
            lastSavedAt: now,
            primarySnapshot: snapshot,
          };
        }
        return {
          ...item,
          status: "senior-review" as const,
          submittedAt: now,
          lastSavedAt: now,
          primarySnapshot: snapshot,
        };
      }),
    );
    return true;
  }, []);

  const completeSeniorReview = useCallback((id: string, decision: Decision) => {
    if (decision !== "approve" && decision !== "return-to-uw") return false;
    persist(
      state.map((item) => {
        if (item.id !== id) return item;
        const now = new Date().toISOString();
        if (decision === "approve") {
          return {
            ...item,
            status: "approved",
            seniorDecision: decision,
            approvedAt: now,
            lastSavedAt: now,
          };
        }
        return {
          ...item,
          status: "returned",
          seniorDecision: decision,
          returnedAt: now,
          lastSavedAt: now,
        };
      }),
    );
    return true;
  }, []);

  const resetStore = useCallback(() => {
    clientHydrated = true;
    persist(syncServicingApplications(clone(seedApplications)));
  }, []);

  const value = useMemo(
    () => ({
      ready: true,
      role,
      setRole,
      applications,
      getApplication,
      updateApplication,
      submitToSenior,
      completeSeniorReview,
      resetStore,
    }),
    [
      role,
      applications,
      getApplication,
      updateApplication,
      submitToSenior,
      completeSeniorReview,
      resetStore,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}

export function useApplication(id: string) {
  const { getApplication, updateApplication, ready } = useStore();
  const application = getApplication(id);
  return { application, updateApplication, ready };
}
