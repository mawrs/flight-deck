"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { opsSeed } from "./ops-data";
import { CURRENT_USER, mentionedPeople } from "./mentions";
import { caseNumberLabel, statusAfterAmounts } from "./ops-logic";
import { CASE_STATUSES, type CasePatch, type CasePriority, type CaseStatus, type Disbursement, type FeedPost, type OpsNotification, type OpsProduct, type OpsState, type SchoolResponse, type ServicingCase, type ServicingLoan } from "./ops-types";

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

const PREVIOUS_FEED = new Map<string, string>([
  [
    "feed-1",
    "Called the bursar about Noor Cohen. The fall disbursement date passed and the funds are still scheduled. They can confirm the roster today if we resend the certification request.",
  ],
  [
    "feed-2",
    "Mateo Ruiz called again. The September 28 disbursement never hit the school account. I told him we are checking with the servicer before we promise a date.",
  ],
  [
    "feed-3",
    "Spoke with Sana Okoye. She only wanted to know when the spring disbursement shows on the school account. No change to the certified dates.",
  ],
  [
    "feed-4",
    "Medical College of Wisconsin asked us to resend Claire Adeyemi's certification before the October disbursement. The first disbursement already went out.",
  ],
  [
    "feed-5",
    "Jonah Ellis's EdMed certification came back reduced. Comparing the certified amount to cost of attendance before we release the September disbursement.",
  ],
  [
    "feed-6",
    "Priya Raman wants the first disbursement moved. Emory's school date is the same day, so this needs a same-day review if we are going to split it.",
  ],
]);

const PREVIOUS_CASE_DETAILS = new Map<string, string>([
  ["case-3001", "School disbursement date has passed and the funds are still scheduled. Confirm the roster before release."],
  ["case-3004", "EdMed certification was reduced and the disbursement date has passed. Review the certified amount against cost of attendance."],
]);

const LEGACY_CASE_STATUS = new Set(["waiting-on-advisor", "waiting-on-school", "resolved"]);
const CASE_STATUS_IDS = new Set<string>(CASE_STATUSES.map((item) => item.id));

function migrateCaseStatus(value: string, legacyStore: boolean): CaseStatus {
  if (value === "waiting-on-advisor" || value === "waiting-on-school") return "on-hold";
  if (value === "resolved") return "closed";
  if (value === "open" && legacyStore) return "new";
  if (CASE_STATUS_IDS.has(value as CaseStatus)) return value as CaseStatus;
  return "new";
}

function mergeOpsSeed(saved: OpsState): OpsState {
  const seedCerts = new Map(opsSeed.certifications.map((item) => [item.id, item]));
  const seedLoans = new Map(opsSeed.loans.map((item) => [item.id, item]));
  const certifications = saved.certifications.map((item) => {
    const seed = seedCerts.get(item.id);
    return {
      ...item,
      product: asProduct(item.product),
      ...(seed?.applicationId ? { applicationId: seed.applicationId, borrower: seed.borrower } : {}),
    };
  });
  const loans = saved.loans.map((item) => {
    const seed = seedLoans.get(item.id);
    return {
      ...item,
      product: asProduct(item.product),
      ...(seed?.applicationId ? { applicationId: seed.applicationId, borrower: seed.borrower } : {}),
    };
  });
  const certIds = new Set(certifications.map((item) => item.id));
  const loanIds = new Set(loans.map((item) => item.id));
  const seedCases = new Map(opsSeed.cases.map((item) => [item.id, item]));
  const caseIds = new Set(saved.cases.map((item) => item.id));
  const legacyStatuses = saved.cases.some((item) => LEGACY_CASE_STATUS.has(item.status));
  const cases = saved.cases.map((item) => {
    const seed = seedCases.get(item.id);
    const status = migrateCaseStatus(item.status, legacyStatuses);
    if (!seed) return { ...item, status };
    const details = item.details === PREVIOUS_CASE_DETAILS.get(item.id) ? seed.details : item.details;
    const openedBy = item.id === "case-3004" && item.openedBy === "Nathan" ? seed.openedBy : item.openedBy;
    return {
      ...item,
      status,
      openedBy,
      details,
      subject: item.subject || seed.subject,
      disbursement: item.disbursement ?? seed.disbursement,
    };
  });
  const savedFeed = Array.isArray(saved.feed) ? saved.feed : [];
  const seedFeed = new Map(opsSeed.feed.map((item) => [item.id, item]));
  const feed = savedFeed.map((item) => {
    const seed = seedFeed.get(item.id);
    if (seed && item.body === PREVIOUS_FEED.get(item.id)) return { ...item, body: seed.body };
    return item;
  });
  const feedIds = new Set(feed.map((item) => item.id));
  return {
    certifications: [...certifications, ...opsSeed.certifications.filter((item) => !certIds.has(item.id))],
    loans: [...loans, ...opsSeed.loans.filter((item) => !loanIds.has(item.id))],
    cases: [...cases, ...opsSeed.cases.filter((item) => !caseIds.has(item.id))],
    feed: [...feed, ...opsSeed.feed.filter((item) => !feedIds.has(item.id))],
    documents: mergeDocuments(saved),
    notifications: mergeNotifications(saved),
  };
}

function mergeNotifications(saved: OpsState) {
  const savedNotes = Array.isArray(saved.notifications) ? saved.notifications : [];
  const seedById = new Map(opsSeed.notifications.map((item) => [item.id, item]));
  const merged = savedNotes.map((item) => {
    const seed = seedById.get(item.id);
    return seed ? { ...seed, read: item.read } : item;
  });
  const ids = new Set(merged.map((item) => item.id));
  return [...merged, ...opsSeed.notifications.filter((item) => !ids.has(item.id))];
}

function mergeDocuments(saved: OpsState) {
  const savedDocs = Array.isArray(saved.documents) ? saved.documents : [];
  const docIds = new Set(savedDocs.map((item) => item.id));
  return [...savedDocs, ...opsSeed.documents.filter((item) => !docIds.has(item.id))];
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
  if (!Array.isArray(state.feed)) state = { ...state, feed: clone(opsSeed.feed) };
  if (!Array.isArray(state.documents)) state = { ...state, documents: clone(opsSeed.documents) };
  if (!Array.isArray(state.notifications)) state = { ...state, notifications: clone(opsSeed.notifications) };
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
  feed: OpsState["feed"];
  documents: OpsState["documents"];
  notifications: OpsState["notifications"];
  addFeedPost: (caseId: string, author: string, body: string) => void;
  addApplicationFeedNote: (applicationId: string, author: string, body: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (input: { kind: OpsNotification["kind"]; actor: string; body: string; caseId?: string; href?: string }) => void;
  addFeedComment: (postId: string, author: string, body: string) => void;
  toggleFeedLike: (postId: string) => void;
  recordSchoolResponse: (id: string, response: SchoolResponse) => void;
  resendCertification: (id: string) => void;
  rejectCertification: (id: string) => void;
  editSchoolCode: (certificationId: string, schoolCode: string) => void;
  updateDisbursement: (loanId: string, disbursementId: string, amount: number) => void;
  markDisbursed: (loanId: string, disbursementId: string) => void;
  reassignCase: (id: string, assignee: string) => void;
  resolveCase: (id: string) => void;
  saveCaseNotes: (id: string, notes: string) => void;
  updateCase: (id: string, patch: CasePatch) => void;
  createCase: (input: {
    subject: string;
    details: string;
    priority: CasePriority;
    origin: string;
    reason: string;
    contactName: string;
    opportunity: string;
    queue: string;
    subQueue: string;
    requestType: string;
    projectDue: string;
    disbursementStatus: string;
  }) => string;
  sendSchoolEmail: (
    caseId: string,
    author: string,
    email: { to: string; cc?: string; bcc?: string; school: string; subject: string; body: string; fileName: string },
  ) => void;
  addCaseDocuments: (caseId: string, files: { id: string; name: string }[]) => void;
}

const OpsContext = createContext<OpsStore | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<OpsStore>(() => {
    return {
      certifications: snapshot.certifications,
      loans: snapshot.loans,
      cases: snapshot.cases,
      feed: snapshot.feed,
      documents: snapshot.documents,
      notifications: snapshot.notifications,
      addFeedPost: (caseId, author, body) => {
        const note = body.trim();
        if (!note) return;
        edit((current) => {
          pushFeedNote(current, { caseId, author, body: note });
        });
      },
      addApplicationFeedNote: (applicationId, author, body) => {
        const note = body.trim();
        if (!note || !applicationId) return;
        edit((current) => {
          const loanIds = new Set(
            current.loans.filter((loan) => loan.applicationId === applicationId).map((loan) => loan.id),
          );
          const match = current.cases
            .filter((item) => loanIds.has(item.loanId))
            .sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
          pushFeedNote(current, {
            caseId: match?.id ?? `application-${applicationId}`,
            applicationId,
            author,
            body: note,
          });
        });
      },
      markNotificationRead: (id) => {
        edit((current) => {
          const item = noteList(current).find((entry) => entry.id === id);
          if (item) item.read = true;
        });
      },
      markAllNotificationsRead: () => {
        edit((current) => {
          for (const item of noteList(current)) item.read = true;
        });
      },
      addNotification: ({ kind, actor, body, caseId = "", href }) => {
        const note = body.trim();
        if (!note) return;
        edit((current) => {
          pushNotification(current, {
            id: `notice-${Date.now().toString(36)}`,
            kind,
            actor,
            body: note,
            caseId,
            href,
            createdAt: new Date().toISOString(),
            read: false,
          });
        });
      },
      addFeedComment: (postId, author, body) => {
        const note = body.trim();
        if (!note) return;
        edit((current) => {
          const post = feedPost(current, postId);
          if (!post) return;
          post.comments.push({
            id: `comment-${Date.now().toString(36)}`,
            author,
            body: note,
            createdAt: new Date().toISOString(),
          });
        });
      },
      toggleFeedLike: (postId) => {
        edit((current) => {
          const post = feedPost(current, postId);
          if (!post) return;
          post.liked = !post.liked;
          post.likes += post.liked ? 1 : -1;
        });
      },
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
          if (!item || item.status === "closed") return;
          item.assignee = assignee;
        });
      },
      resolveCase: (id) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item) return;
          item.status = "closed" satisfies CaseStatus;
        });
      },
      saveCaseNotes: (id, notes) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item) return;
          item.notes = notes;
        });
      },
      addCaseDocuments: (caseId, files) => {
        const incoming = files.filter((file) => file.name.trim());
        if (!incoming.length) return;
        edit((current) => {
          if (!Array.isArray(current.documents)) current.documents = [];
          const uploadedAt = new Date().toISOString();
          current.documents.unshift(
            ...incoming.map((file) => ({
              id: file.id,
              caseId,
              name: file.name.trim(),
              fileName: file.name.trim(),
              uploadedBy: CURRENT_USER,
              uploadedAt,
            })),
          );
        });
      },
      sendSchoolEmail: (caseId, author, email) => {
        const body = email.body.trim();
        if (!body) return;
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === caseId);
          if (!item) return;
          if (!Array.isArray(current.feed)) current.feed = [];
          if (!Array.isArray(current.documents)) current.documents = [];
          const now = new Date().toISOString();
          const id = Date.now().toString(36);
          const cc = email.cc?.trim() ?? "";
          const bcc = email.bcc?.trim() ?? "";
          current.feed.unshift({
            id: `feed-${id}`,
            caseId,
            author,
            body,
            createdAt: now,
            likes: 0,
            liked: false,
            comments: [],
            kind: "email",
            audience: email.school,
            subject: email.subject,
            emailTo: email.to,
            emailCc: cc,
            emailBcc: bcc,
          });
          current.documents.unshift({
            id: `doc-${id}`,
            caseId,
            name: email.fileName,
            fileName: email.fileName,
            uploadedBy: author,
            uploadedAt: now,
            subject: email.subject,
            emailBody: body,
            emailTo: email.to,
            emailCc: cc,
            emailBcc: bcc,
          });
        });
      },
      updateCase: (id, patch) => {
        edit((current) => {
          const item = current.cases.find((entry) => entry.id === id);
          if (!item) return;
          if (patch.subject !== undefined) item.subject = patch.subject;
          if (patch.details !== undefined) item.details = patch.details;
          if (patch.notes !== undefined) item.notes = patch.notes;
          if (patch.fileNotes !== undefined) item.fileNotes = patch.fileNotes;
          if (patch.fileNotesUpdatedAt !== undefined) item.fileNotesUpdatedAt = patch.fileNotesUpdatedAt;
          if (patch.status !== undefined) item.status = patch.status;
          if (patch.priority !== undefined) item.priority = patch.priority;
          if (patch.type !== undefined) item.type = patch.type;
          if (patch.assignee !== undefined) item.assignee = patch.assignee;
          if (patch.form) item.form = { ...item.form, ...patch.form };
        });
      },
      createCase: (input) => {
        let id = "";
        edit((current) => {
          const loan = current.loans[0];
          if (!loan) return;
          const used = current.cases.map((item) => Number(item.id.replace(/\D/g, ""))).filter((value) => Number.isFinite(value));
          const next = Math.max(3000, ...used, 0) + 1;
          id = `case-${next}`;
          const openedAt = new Date().toISOString();
          const item: ServicingCase = {
            id,
            loanId: loan.id,
            type: "borrower-follow-up",
            priority: input.priority,
            status: "new",
            openedBy: "Demo Account",
            assignee: "Demo Account",
            openedAt,
            subject: input.subject.trim(),
            disbursement: "",
            details: input.details.trim(),
            notes: "",
            form: {
              caseNumber: caseNumberLabel(id),
              contactName: input.contactName,
              opportunity: input.opportunity,
              origin: input.origin,
              reason: input.reason,
              requestType: input.requestType,
              queue: input.queue,
              subQueue: input.subQueue,
              projectDue: input.projectDue,
              disbursementStatus: input.disbursementStatus,
            },
          };
          current.cases.unshift(item);
          const payoff = input.reason === "Disbursement/Payoff";
          pushNotification(current, {
            id: `note-${id}`,
            kind: "case-created",
            actor: CURRENT_USER,
            body: payoff
              ? `${CURRENT_USER} has created a new Disbursement/Payoff Servicing Case with Case#: ${caseNumberLabel(id)}`
              : `${CURRENT_USER} has created a new Servicing Case with Case#: ${caseNumberLabel(id)}`,
            caseId: id,
            createdAt: openedAt,
            read: false,
          });
        });
        return id;
      },
    };
  }, [snapshot]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

function noteList(current: OpsState) {
  if (!Array.isArray(current.notifications)) current.notifications = [];
  return current.notifications;
}

function pushFeedNote(
  current: OpsState,
  post: { caseId: string; applicationId?: string; author: string; body: string },
) {
  if (!Array.isArray(current.feed)) current.feed = [];
  const createdAt = new Date().toISOString();
  current.feed.unshift({
    id: `feed-${Date.now().toString(36)}`,
    caseId: post.caseId,
    applicationId: post.applicationId,
    author: post.author,
    body: post.body,
    createdAt,
    likes: 0,
    liked: false,
    comments: [],
    kind: "note",
    audience: "Southeast Bank Only",
  });
  if (mentionedPeople(post.body).includes(CURRENT_USER)) {
    pushNotification(current, {
      id: `note-${Date.now().toString(36)}`,
      kind: "mention",
      actor: post.author,
      body: post.body,
      caseId: post.caseId,
      createdAt,
      read: false,
    });
  }
}

function pushNotification(current: OpsState, item: OpsNotification) {
  noteList(current).unshift(item);
}

function feedPost(current: OpsState, postId: string): FeedPost | undefined {
  if (!Array.isArray(current.feed)) current.feed = [];
  const existing = current.feed.find((item) => item.id === postId);
  if (existing) return existing;
  if (!postId.startsWith("created-")) return undefined;
  const item = current.cases.find((entry) => entry.id === postId.slice("created-".length));
  if (!item) return undefined;
  const post: FeedPost = {
    id: postId,
    caseId: item.id,
    author: item.openedBy,
    body: item.details || item.subject,
    createdAt: item.openedAt,
    likes: 0,
    liked: false,
    comments: [],
    kind: "created",
  };
  current.feed.push(post);
  return post;
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
