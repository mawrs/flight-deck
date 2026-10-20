"use client";

import { useSyncExternalStore } from "react";
import {
  SAMPLE_INSIGHTS,
  SAMPLE_TRANSCRIPT,
  buildOpening,
  customerByAccount,
  disclosuresFor,
  isAccountOpening,
  issuedAccountNumber,
  applicationLink,
  missingSendRequirements,
  productById,
  sameFieldValue,
  seedAccountOpenings,
} from "@/lib/account-opening-data";
import { money } from "@/lib/format";
import type {
  AccountOpening,
  AccountOpeningChannel,
  ActivityEvent,
  CreateAccountOpeningInput,
  OpeningField,
} from "@/lib/account-opening-types";

const STORAGE_KEY = "flight-deck-account-opening-v2";

let state = seedAccountOpenings;
let clientHydrated = false;
const listeners = new Set<() => void>();
let listeningForStorage = false;

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && !listeningForStorage) {
    listeningForStorage = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      clientHydrated = false;
      state = load();
      clientHydrated = true;
      for (const current of listeners) current();
    });
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function load(): AccountOpening[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedAccountOpenings;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isAccountOpening)) return seedAccountOpenings;
    const refreshed = new Map(
      seedAccountOpenings.filter((opening) => opening.id !== "AO-10482").map((opening) => [opening.id, opening]),
    );
    const seen = new Set<string>();
    const next = parsed.map((opening) => {
      const seed = refreshed.get(opening.id);
      if (seed) {
        seen.add(opening.id);
        return structuredClone(seed);
      }
      if (!opening.transcript.some((line) => line.id.startsWith("sample-"))) return opening;
      return {
        ...opening,
        transcript: structuredClone(SAMPLE_TRANSCRIPT),
        insights: opening.insights.map((insight) => {
          const sample = SAMPLE_INSIGHTS.find((item) => item.id === insight.id);
          return sample ? { ...sample, status: insight.status } : insight;
        }),
      };
    });
    for (const [id, seed] of refreshed) {
      if (!seen.has(id)) next.push(structuredClone(seed));
    }
    return next;
  } catch {
    return seedAccountOpenings;
  }
}

function getSnapshot() {
  if (!clientHydrated) {
    state = load();
    clientHydrated = true;
  }
  return state;
}

function getServerSnapshot() {
  return seedAccountOpenings;
}

function commit(next: AccountOpening[]) {
  state = next;
  clientHydrated = true;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

function update(id: string, recipe: (opening: AccountOpening) => AccountOpening) {
  const current = getSnapshot();
  commit(current.map((opening) => (opening.id === id ? recipe(structuredClone(opening)) : opening)));
}

function nowStamp() {
  return new Date().toISOString();
}

function activity(text: string, at = nowStamp()): ActivityEvent {
  return { id: `act-${at}-${Math.random().toString(36).slice(2, 8)}`, at, text };
}

function applyAccountNumber(opening: AccountOpening, value: string): AccountOpening {
  const customer = customerByAccount(value);
  const fields = {
    ...opening.fields,
    accountNumber: { ...opening.fields.accountNumber, value, source: "agent" as const },
  };
  if (!customer) {
    for (const key of ["customerId", "existingAccount", "fullName", "email", "phone", "birthDate", "address"] as const) {
      if (fields[key].source === "profile") {
        fields[key] = {
          value: "",
          source: key === "customerId" || key === "existingAccount" ? "profile" : "agent",
        };
      }
    }
    return { ...opening, fields };
  }
  if (opening.fields.customerId.value === customer.customerId) {
    return { ...opening, fields: { ...fields, accountNumber: { value: customer.accountNumber, source: "agent" } } };
  }
  function fill(key: OpeningField, profileValue: string) {
    const current = opening.fields[key];
    if (current.source === "agent" && current.value.trim() && current.value !== profileValue) return current;
    return { value: profileValue, source: "profile" as const, profileValue };
  }
  return {
    ...opening,
    relationship: "existing",
    fields: {
      ...fields,
      accountNumber: { value: customer.accountNumber, source: "agent" },
      customerId: { value: customer.customerId, source: "profile", profileValue: customer.customerId },
      existingAccount: { value: customer.existingAccount, source: "profile", profileValue: customer.existingAccount },
      fullName: fill("fullName", customer.fullName),
      email: fill("email", customer.email),
      phone: fill("phone", customer.phone),
      birthDate: fill("birthDate", customer.birthDate),
      address: fill("address", customer.address),
    },
    activity: [
      ...opening.activity,
      activity(`Kate entered account ${customer.accountNumber}. Customer profile verified for ${customer.fullName}.`),
    ],
  };
}

function nextId(openings: AccountOpening[]) {
  const max = openings.reduce((highest, opening) => {
    const value = Number(opening.id.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 10400);
  return `AO-${max + 1}`;
}

export function useAccountOpenings() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useAccountOpening(id: string) {
  return useAccountOpenings().find((opening) => opening.id === id) ?? null;
}

export function createOpening(input: CreateAccountOpeningInput) {
  const openings = getSnapshot();
  const id = nextId(openings);
  commit([buildOpening(input, id, nowStamp()), ...openings]);
  return id;
}

export function updateOpeningField(id: string, field: OpeningField, value: string) {
  update(id, (opening) => {
    if (field === "accountNumber") return applyAccountNumber(opening, value);
    const current = opening.fields[field];
    const related = opening.insights.find((insight) => insight.field === field);
    const matchesInsight = related ? sameFieldValue(field, related.value, value) : false;
    const matchesProfile = current.profileValue ? sameFieldValue(field, current.profileValue, value) : false;
    const source = !value.trim() && related ? "conversation" : matchesInsight ? "conversation" : matchesProfile ? "profile" : "agent";
    return {
      ...opening,
      fields: {
        ...opening.fields,
        [field]: { ...current, value, source },
      },
      insights: opening.insights.map((insight) => {
        if (insight.field !== field) return insight;
        if (!value.trim()) return { ...insight, status: "suggested" };
        return { ...insight, status: matchesInsight ? "accepted" : "dismissed" };
      }),
    };
  });
}

export function acceptInsight(id: string, insightId: string) {
  update(id, (opening) => {
    const insight = opening.insights.find((item) => item.id === insightId);
    if (!insight || insight.status !== "suggested") return opening;
    return {
      ...opening,
      fields: {
        ...opening.fields,
        [insight.field]: {
          ...opening.fields[insight.field],
          value: insight.value,
          source: "conversation",
        },
      },
      insights: opening.insights.map((item) => (item.id === insightId ? { ...item, status: "accepted" } : item)),
      activity: [...opening.activity, activity(`Kate accepted ${insight.displayValue} from the conversation.`)],
    };
  });
}

export function dismissInsight(id: string, insightId: string) {
  update(id, (opening) => {
    const insight = opening.insights.find((item) => item.id === insightId);
    if (!insight || insight.status !== "suggested") return opening;
    const current = opening.fields[insight.field];
    const clear = !current.value || sameFieldValue(insight.field, current.value, insight.value);
    return {
      ...opening,
      fields: clear
        ? { ...opening.fields, [insight.field]: { ...current, value: "", source: "agent" } }
        : opening.fields,
      insights: opening.insights.map((item) => (item.id === insightId ? { ...item, status: "dismissed" } : item)),
      activity: [...opening.activity, activity(`Kate dismissed ${insight.displayValue}.`)],
    };
  });
}

export function acceptAllInsights(id: string) {
  update(id, (opening) => {
    const suggested = opening.insights.filter((insight) => insight.status === "suggested");
    if (suggested.length === 0) return opening;
    const fields = { ...opening.fields };
    for (const insight of suggested) {
      fields[insight.field] = { ...fields[insight.field], value: insight.value, source: "conversation" };
    }
    return {
      ...opening,
      fields,
      insights: opening.insights.map((insight) =>
        insight.status === "suggested" ? { ...insight, status: "accepted" } : insight,
      ),
      activity: [...opening.activity, activity("Kate accepted the detected funding and product details.")],
    };
  });
}

export function setOpeningChannel(id: string, channel: AccountOpeningChannel) {
  update(id, (opening) => {
    if (opening.channel === channel || opening.status === "opened") return opening;
    return {
      ...opening,
      channel,
      activity: [
        ...opening.activity,
        activity(channel === "branch-event" ? "Kate switched this opening to the branch event tablet." : "Kate switched this opening to the call center."),
      ],
    };
  });
}

export function loadSampleCall(id: string) {
  update(id, (opening) => {
    if (opening.transcript.length > 0 || opening.status === "opened") return opening;
    return {
      ...opening,
      transcript: SAMPLE_TRANSCRIPT.map((line) => ({ ...line })),
      insights: SAMPLE_INSIGHTS.map((insight) => ({ ...insight })),
      fields: {
        ...opening.fields,
        availableFunds: { ...opening.fields.availableFunds, value: "", source: "conversation" },
        transferAmount: { ...opening.fields.transferAmount, value: "", source: "conversation" },
        productId: { ...opening.fields.productId, value: "", source: "conversation" },
      },
      activity: [
        ...opening.activity,
        activity("Sample call attached. $50,000 available, $15,000 to open, and a 12-month CD are waiting for Kate to accept."),
      ],
    };
  });
}

export function restoreProfileValue(id: string, field: OpeningField) {
  update(id, (opening) => {
    const current = opening.fields[field];
    if (!current.profileValue) return opening;
    return {
      ...opening,
      fields: {
        ...opening.fields,
        [field]: { ...current, value: current.profileValue, source: "profile" },
      },
    };
  });
}

export function sendOpeningLink(id: string) {
  update(id, (opening) => {
    if (opening.handoff !== "not-sent" || missingSendRequirements(opening).length > 0) return opening;
    const destination = opening.fields.email.value || opening.fields.phone.value;
    const text =
      opening.channel === "branch-event"
        ? "Kate handed over the prefilled application."
        : `Application emailed to ${destination}. ${applicationLink(opening.id)}`;
    return {
      ...opening,
      handoff: "sent",
      status: "awaiting-signature",
      activity: [...opening.activity, activity(text)],
    };
  });
}

export function markOpeningReviewing(id: string) {
  update(id, (opening) => {
    if (opening.handoff !== "sent") return opening;
    return {
      ...opening,
      handoff: "reviewing",
      status: "awaiting-signature",
      activity: [...opening.activity, activity(`${opening.fields.fullName.value || "The customer"} opened the application.`)],
    };
  });
}

export function signOpening(id: string) {
  update(id, (opening) => {
    if (opening.handoff === "not-sent" || opening.status === "opened") return opening;
    const product = productById(opening.fields.productId.value);
    const amount = Number(opening.fields.transferAmount.value);
    const accountNumber = issuedAccountNumber(opening);
    const disclosureCount = disclosuresFor(opening.fields.productId.value).length;
    return {
      ...opening,
      handoff: "signed",
      status: "opened",
      openedAt: nowStamp(),
      newAccountNumber: accountNumber,
      activity: [
        ...opening.activity,
        activity(`${opening.fields.fullName.value || "The customer"} confirmed the amounts, signed ${disclosureCount} disclosures, and submitted the application.`),
        activity(`Opened ${product?.name ?? "account"} ${accountNumber} for ${money(amount)}.`),
      ],
    };
  });
}
