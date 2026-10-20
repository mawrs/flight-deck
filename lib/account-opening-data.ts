import { money } from "@/lib/format";
import type {
  AccountOpening,
  AccountOpeningChannel,
  ActivityEvent,
  ConversationInsight,
  CreateAccountOpeningInput,
  DepositProduct,
  FieldSource,
  KnownCustomer,
  OpeningField,
  OpeningFields,
  SourcedValue,
  TranscriptLine,
} from "@/lib/account-opening-types";

export const SOURCE_LABEL: Record<FieldSource, string> = {
  agent: "Kate entered",
  conversation: "Conversation detected",
  profile: "Customer profile",
};

export const PRODUCTS: DepositProduct[] = [
  { id: "cd-6", name: "6-Month CD", termMonths: 6, apy: 0.0405, kind: "cd" },
  { id: "cd-12", name: "12-Month CD", termMonths: 12, apy: 0.0425, kind: "cd" },
  { id: "cd-24", name: "24-Month CD", termMonths: 24, apy: 0.039, kind: "cd" },
  { id: "rewards-checking", name: "Rewards Checking", termMonths: 0, apy: 0.001, kind: "checking" },
];

export const KNOWN_CUSTOMERS: KnownCustomer[] = [
  {
    accountNumber: "0048219931",
    customerId: "C-229184",
    fullName: "Jordan Hale",
    email: "jordan.hale@example.com",
    phone: "(615) 555-0142",
    birthDate: "04/12/1988",
    address: "418 Church St, Nashville, TN 37219",
    existingAccount: "Rewards Checking · $2,140.18",
  },
  {
    accountNumber: "0048102204",
    customerId: "C-188420",
    fullName: "Maya Chen",
    email: "maya.chen@example.com",
    phone: "(615) 555-0177",
    birthDate: "03/02/1991",
    address: "90 Division St, Nashville, TN 37203",
    existingAccount: "Savings · $22,400.00",
  },
  {
    accountNumber: "0048066118",
    customerId: "C-176550",
    fullName: "Helen Brooks",
    email: "helen.brooks@example.com",
    phone: "(615) 555-0194",
    birthDate: "11/19/1979",
    address: "12 Acklen Ave, Nashville, TN 37212",
    existingAccount: "Money Market · $40,118.55",
  },
  {
    accountNumber: "0048001122",
    customerId: "C-140221",
    fullName: "John Doe",
    email: "john.doe.checking@example.com",
    phone: "(615) 555-0108",
    birthDate: "06/03/1984",
    address: "220 Broadway, Nashville, TN 37201",
    existingAccount: "Checking · $812.40",
  },
  {
    accountNumber: "0048004488",
    customerId: "C-151903",
    fullName: "John Doe",
    email: "john.doe.savings@example.com",
    phone: "(615) 555-0166",
    birthDate: "09/28/1972",
    address: "14 Linden Ave, Nashville, TN 37212",
    existingAccount: "Savings · $6,240.00",
  },
];

export const SAMPLE_TRANSCRIPT: TranscriptLine[] = [
  {
    id: "sample-1",
    at: "00:03",
    speaker: "kate",
    text: "Thank you for calling SouthEast Bank, this is Kate. Who do I have the pleasure of speaking with?",
  },
  {
    id: "sample-2",
    at: "00:08",
    speaker: "customer",
    text: "Hi Kate, this is Jordan Hale.",
  },
  {
    id: "sample-3",
    at: "00:13",
    speaker: "kate",
    text: "Hi Jordan. How can I help you today?",
  },
  {
    id: "sample-4",
    at: "00:18",
    speaker: "customer",
    text: "I've got about fifty thousand dollars sitting in savings. I was thinking about moving fifteen thousand of it somewhere it could earn a little more.",
  },
  {
    id: "sample-5",
    at: "00:28",
    speaker: "kate",
    text: "Absolutely. Are you comfortable leaving that fifteen thousand untouched for twelve months?",
  },
  {
    id: "sample-6",
    at: "00:35",
    speaker: "customer",
    text: "Yeah, I won't need it this year.",
  },
  {
    id: "sample-7",
    at: "00:40",
    speaker: "kate",
    text: "In that case, our twelve-month CD is paying 4.25 percent APY right now.",
  },
  {
    id: "sample-8",
    at: "00:47",
    speaker: "customer",
    text: "Okay, that sounds good. Let's put the fifteen thousand into that CD.",
  },
  {
    id: "sample-9",
    at: "00:54",
    speaker: "kate",
    text: "Great. I'll email you the application with this filled in. Confirm the amount, sign the disclosures, and submit.",
  },
];

export const SAMPLE_INSIGHTS: ConversationInsight[] = [
  {
    id: "sample-available",
    field: "availableFunds",
    value: "50000",
    displayValue: "$50,000 available",
    quote: "I've got about fifty thousand dollars sitting in savings",
    at: "00:18",
    speaker: "Customer",
    transcriptId: "sample-4",
    status: "suggested",
  },
  {
    id: "sample-amount",
    field: "transferAmount",
    value: "15000",
    displayValue: "$15,000 to open",
    quote: "I was thinking about moving fifteen thousand",
    at: "00:18",
    speaker: "Customer",
    transcriptId: "sample-4",
    status: "suggested",
  },
  {
    id: "sample-product",
    field: "productId",
    value: "cd-12",
    displayValue: "12-Month CD",
    quote: "Let's put the fifteen thousand into that CD.",
    at: "00:47",
    speaker: "Customer",
    transcriptId: "sample-8",
    status: "suggested",
  },
];

const FIELD_LABEL: Record<OpeningField, string> = {
  accountNumber: "Account number",
  customerId: "Customer ID",
  existingAccount: "Existing relationship",
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  birthDate: "Date of birth",
  address: "Address",
  availableFunds: "Available funds",
  transferAmount: "Amount to open",
  productId: "Product",
};

export function fieldLabel(field: OpeningField) {
  return FIELD_LABEL[field];
}

export function channelLabel(channel: AccountOpeningChannel) {
  return channel === "branch-event" ? "Branch event" : "Call center";
}

export function statusLabel(status: AccountOpening["status"]) {
  if (status === "awaiting-signature") return "Awaiting submission";
  if (status === "opened") return "Opened";
  return "In progress";
}

export function normalizeAccount(value: string) {
  return value.replace(/[\s-]/g, "");
}

export function productById(id: string) {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

export function parseMoney(value: string) {
  const amount = Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

export function sameFieldValue(field: OpeningField, left: string, right: string) {
  if (field === "availableFunds" || field === "transferAmount") {
    const leftAmount = parseMoney(left);
    return leftAmount != null && leftAmount === parseMoney(right);
  }
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function productQuote(amount: number, product: DepositProduct) {
  if (product.kind !== "cd") {
    return { interest: null as number | null, maturity: null as number | null, termLabel: "Open-ended" };
  }
  const interest = Math.round(amount * product.apy * (product.termMonths / 12) * 100) / 100;
  return {
    interest,
    maturity: Math.round((amount + interest) * 100) / 100,
    termLabel: `${product.termMonths} months`,
  };
}

export type OpeningDisclosure = {
  id: string;
  title: string;
  detail: string;
};

export function disclosuresFor(productId: string): OpeningDisclosure[] {
  const product = productById(productId);
  const items: OpeningDisclosure[] = [
    {
      id: "econsent",
      title: "Electronic records consent",
      detail: "Review and sign the account documents electronically.",
    },
    {
      id: "privacy",
      title: "Privacy notice",
      detail: "How SouthEast Bank collects and shares customer information.",
    },
    {
      id: "deposit",
      title: "Deposit account agreement",
      detail: "Ownership, funding, and account terms for this opening.",
    },
    {
      id: "tis",
      title: "Truth in Savings",
      detail: "Rate, term, and balance details for the selected product.",
    },
  ];
  if (product?.kind === "cd") {
    items.push({
      id: "penalty",
      title: "CD early withdrawal penalty",
      detail: "A penalty may apply if funds are withdrawn before maturity.",
    });
  }
  return items;
}

export function applicationLink(id: string) {
  return `https://apply.southeastbank.com/account-opening/${id}`;
}

export function issuedAccountNumber(opening: AccountOpening) {
  const product = productById(opening.fields.productId.value);
  const prefix = product?.kind === "checking" ? "44" : "55";
  return `${prefix}${opening.id.replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

export function missingSendRequirements(opening: AccountOpening) {
  const missing: string[] = [];
  if (!opening.fields.fullName.value.trim()) missing.push("customer name");
  if (opening.channel === "call-center" && !opening.fields.email.value.trim()) missing.push("email");
  else if (!opening.fields.phone.value.trim() && !opening.fields.email.value.trim()) missing.push("phone or email");
  if (!parseMoney(opening.fields.transferAmount.value)) missing.push("opening amount");
  if (!productById(opening.fields.productId.value)) missing.push("product");
  if (opening.relationship === "existing" && !opening.fields.customerId.value) missing.push("a matched account number");
  return missing;
}

export function handoffSteps(channel: AccountOpeningChannel) {
  return [
    "Information confirmed",
    channel === "branch-event" ? "Application handed over" : "Application emailed",
    "Customer opened application",
    "Application submitted",
    "Account opened",
  ];
}

export function handoffStep(opening: AccountOpening) {
  if (opening.status === "opened") return 4;
  if (opening.handoff === "signed") return 3;
  if (opening.handoff === "reviewing") return 2;
  if (opening.handoff === "sent") return 2;
  if (missingSendRequirements(opening).length === 0) return 1;
  return 0;
}

export function openingProductName(opening: AccountOpening) {
  const selected = productById(opening.fields.productId.value);
  if (selected) return selected.name;
  const detected = opening.insights.find((insight) => insight.field === "productId" && insight.status === "suggested");
  return detected ? `Detected ${detected.displayValue}` : "—";
}

export function openingAmountLabel(opening: AccountOpening) {
  const amount = parseMoney(opening.fields.transferAmount.value);
  if (amount != null) return money(amount);
  const detected = opening.insights.find((insight) => insight.field === "transferAmount" && insight.status === "suggested");
  return detected ? `Detected ${money(Number(detected.value))}` : "—";
}

export function customerByAccount(accountNumber: string) {
  const normalized = normalizeAccount(accountNumber);
  return KNOWN_CUSTOMERS.find((customer) => customer.accountNumber === normalized) ?? null;
}

function sourced(value: string, source: FieldSource, profileValue?: string): SourcedValue {
  return profileValue === undefined ? { value, source } : { value, source, profileValue };
}

function emptyFields(): OpeningFields {
  return {
    accountNumber: sourced("", "agent"),
    customerId: sourced("", "profile"),
    existingAccount: sourced("", "profile"),
    fullName: sourced("", "agent"),
    email: sourced("", "agent"),
    phone: sourced("", "agent"),
    birthDate: sourced("", "agent"),
    address: sourced("", "agent"),
    availableFunds: sourced("", "agent"),
    transferAmount: sourced("", "agent"),
    productId: sourced("", "agent"),
  };
}

function withCustomer(fields: OpeningFields, customer: KnownCustomer, accountNumber: string): OpeningFields {
  return {
    ...fields,
    accountNumber: sourced(accountNumber, "agent"),
    customerId: sourced(customer.customerId, "profile", customer.customerId),
    existingAccount: sourced(customer.existingAccount, "profile", customer.existingAccount),
    fullName: sourced(customer.fullName, "profile", customer.fullName),
    email: sourced(customer.email, "profile", customer.email),
    phone: sourced(customer.phone, "profile", customer.phone),
    birthDate: sourced(customer.birthDate, "profile", customer.birthDate),
    address: sourced(customer.address, "profile", customer.address),
  };
}

function cloneInsights(status: ConversationInsight["status"] = "suggested") {
  return SAMPLE_INSIGHTS.map((insight) => ({ ...insight, status }));
}

function event(id: string, at: string, text: string): ActivityEvent {
  return { id, at, text };
}

export function buildOpening(input: CreateAccountOpeningInput, id: string, now: string): AccountOpening {
  const accountNumber = normalizeAccount(input.accountNumber);
  const customer = input.relationship === "existing" ? customerByAccount(accountNumber) : null;
  let fields = emptyFields();
  if (customer) {
    fields = withCustomer(fields, customer, accountNumber);
  } else if (input.relationship === "new") {
    fields = {
      ...fields,
      fullName: sourced(input.fullName.trim(), "agent"),
      phone: sourced(input.phone.trim(), "agent"),
      email: sourced(input.email.trim(), "agent"),
    };
  } else {
    fields = { ...fields, accountNumber: sourced(input.accountNumber.trim(), "agent") };
  }
  if (input.attachSampleCall) {
    fields = {
      ...fields,
      availableFunds: sourced("", "conversation"),
      transferAmount: sourced("", "conversation"),
      productId: sourced("", "conversation"),
    };
  }
  const activity = [
    event(
      `${id}-start`,
      now,
      input.channel === "branch-event"
        ? "Kate started an account opening at a branch event."
        : "Kate started an account opening from the call center.",
    ),
  ];
  if (customer) {
    activity.push(event(`${id}-lookup`, now, `Kate entered account ${accountNumber}. Customer profile verified for ${customer.fullName}.`));
  } else if (input.relationship === "existing") {
    activity.push(event(`${id}-miss`, now, `Kate entered account ${input.accountNumber.trim() || "—"}. No customer profile matched.`));
  } else {
    activity.push(event(`${id}-new`, now, "Marked as a new customer. Name and phone are Kate's entries."));
  }
  if (input.attachSampleCall) {
    activity.push(
      event(
        `${id}-call`,
        now,
        "Call transcript added. $50,000 available, $15,000 to open, and a 12-month CD are waiting for Kate to accept.",
      ),
    );
  }
  return {
    id,
    agentName: "Kate",
    channel: input.channel,
    relationship: input.relationship,
    status: "in-progress",
    startedAt: now,
    openedAt: null,
    newAccountNumber: null,
    handoff: "not-sent",
    fields,
    transcript: input.attachSampleCall ? SAMPLE_TRANSCRIPT.map((line) => ({ ...line })) : [],
    insights: input.attachSampleCall ? cloneInsights() : [],
    activity,
  };
}

function baseOpening(input: {
  id: string;
  channel: AccountOpeningChannel;
  relationship: "existing" | "new";
  status: AccountOpening["status"];
  handoff: AccountOpening["handoff"];
  startedAt: string;
  openedAt: string | null;
  fields: OpeningFields;
  transcript: TranscriptLine[];
  insights: ConversationInsight[];
  activity: ActivityEvent[];
}): AccountOpening {
  return {
    ...input,
    agentName: "Kate",
    newAccountNumber: null,
  };
}

function jordanOpening(): AccountOpening {
  const customer = KNOWN_CUSTOMERS[0];
  const fields = filledSample("50000", "15000", "cd-12", withCustomer(emptyFields(), customer, customer.accountNumber));
  return baseOpening({
    id: "AO-10482",
    channel: "call-center",
    relationship: "existing",
    status: "in-progress",
    handoff: "not-sent",
    startedAt: "2026-10-20T09:14:00",
    openedAt: null,
    fields,
    transcript: SAMPLE_TRANSCRIPT.map((line) => ({ ...line })),
    insights: cloneInsights("accepted"),
    activity: [
      event("AO-10482-1", "2026-10-20T09:14:00", "Kate answered a call center request to move $15,000."),
      event("AO-10482-2", "2026-10-20T09:15:00", "Kate entered account 0048219931. Customer profile verified for Jordan Hale."),
      event("AO-10482-3", "2026-10-20T09:16:00", "Kate accepted the detected 12-month CD for $15,000."),
    ],
  });
}

function filledSample(available: string, amount: string, productId: string, fields: OpeningFields) {
  return {
    ...fields,
    availableFunds: sourced(available, "conversation"),
    transferAmount: sourced(amount, "conversation"),
    productId: sourced(productId, "conversation"),
  };
}

function mayaOpening(): AccountOpening {
  const customer = KNOWN_CUSTOMERS[1];
  const fields = filledSample("22400", "8000", "cd-6", withCustomer(emptyFields(), customer, customer.accountNumber));
  return baseOpening({
    id: "AO-10411",
    channel: "call-center",
    relationship: "existing",
    status: "awaiting-signature",
    handoff: "sent",
    startedAt: "2026-10-19T15:40:00",
    openedAt: null,
    fields,
    transcript: [
      { id: "maya-1", at: "00:03", speaker: "kate", text: "Thank you for calling SouthEast Bank, this is Kate. Who do I have the pleasure of speaking with?" },
      { id: "maya-2", at: "00:08", speaker: "customer", text: "Hi Kate, this is Maya Chen." },
      { id: "maya-3", at: "00:12", speaker: "kate", text: "Hi Maya. How can I help you today?" },
      {
        id: "maya-4",
        at: "00:17",
        speaker: "customer",
        text: "I've got about twenty-two thousand dollars in savings. I want to move eight thousand of it somewhere short, because I may need it next spring.",
      },
      { id: "maya-5", at: "00:26", speaker: "kate", text: "A six-month CD would line up with that. Are you comfortable leaving the eight thousand untouched until then?" },
      { id: "maya-6", at: "00:33", speaker: "customer", text: "Yes, six months is fine." },
      { id: "maya-7", at: "00:37", speaker: "kate", text: "Our six-month CD is paying 4.05 percent APY right now." },
      { id: "maya-8", at: "00:43", speaker: "customer", text: "Let's do the six-month CD." },
      { id: "maya-9", at: "00:48", speaker: "kate", text: "I'll email you the application. Confirm the amount, sign the disclosures, and submit." },
    ],
    insights: [
      {
        id: "maya-available",
        field: "availableFunds",
        value: "22400",
        displayValue: "$22,400 available",
        quote: "twenty-two thousand dollars in savings",
        at: "00:17",
        speaker: "Customer",
        transcriptId: "maya-4",
        status: "accepted",
      },
      {
        id: "maya-amount",
        field: "transferAmount",
        value: "8000",
        displayValue: "$8,000 to open",
        quote: "eight thousand",
        at: "00:17",
        speaker: "Customer",
        transcriptId: "maya-4",
        status: "accepted",
      },
      {
        id: "maya-product",
        field: "productId",
        value: "cd-6",
        displayValue: "6-Month CD",
        quote: "six-month CD",
        at: "00:43",
        speaker: "Customer",
        transcriptId: "maya-8",
        status: "accepted",
      },
    ],
    activity: [
      event("AO-10411-1", "2026-10-19T15:40:00", "Kate entered account 0048102204. Customer profile verified for Maya Chen."),
      event("AO-10411-2", "2026-10-19T15:46:00", "Kate accepted the detected 6-month CD for $8,000."),
      event("AO-10411-3", "2026-10-19T15:48:00", "Application emailed to maya.chen@example.com."),
    ],
  });
}

function priyaOpening(): AccountOpening {
  const fields: OpeningFields = {
    ...emptyFields(),
    fullName: sourced("Priya Shah", "agent"),
    phone: sourced("(615) 555-0134", "agent"),
    email: sourced("priya.shah@example.com", "agent"),
    availableFunds: sourced("500", "conversation"),
    transferAmount: sourced("500", "conversation"),
    productId: sourced("rewards-checking", "conversation"),
  };
  return baseOpening({
    id: "AO-10390",
    channel: "branch-event",
    relationship: "new",
    status: "in-progress",
    handoff: "not-sent",
    startedAt: "2026-10-20T08:05:00",
    openedAt: null,
    fields,
    transcript: [
      { id: "priya-1", at: "00:03", speaker: "kate", text: "Hi, I'm Kate. Welcome in. What can I help you with?" },
      { id: "priya-2", at: "00:08", speaker: "customer", text: "I'm Priya Shah. I just moved to Nashville, and I need a checking account." },
      { id: "priya-3", at: "00:15", speaker: "kate", text: "We can open Rewards Checking for you today. Did you want to deposit anything to start?" },
      { id: "priya-4", at: "00:21", speaker: "customer", text: "I brought five hundred dollars with me." },
      { id: "priya-5", at: "00:26", speaker: "kate", text: "I'll open Rewards Checking with that five hundred. The application is filled in, so we can confirm it and sign on this tablet." },
      { id: "priya-6", at: "00:34", speaker: "customer", text: "That works. Let's open it." },
    ],
    insights: [
      {
        id: "priya-available",
        field: "availableFunds",
        value: "500",
        displayValue: "$500 available",
        quote: "five hundred dollars",
        at: "00:21",
        speaker: "Customer",
        transcriptId: "priya-4",
        status: "accepted",
      },
      {
        id: "priya-amount",
        field: "transferAmount",
        value: "500",
        displayValue: "$500 to open",
        quote: "five hundred",
        at: "00:21",
        speaker: "Customer",
        transcriptId: "priya-4",
        status: "accepted",
      },
      {
        id: "priya-product",
        field: "productId",
        value: "rewards-checking",
        displayValue: "Rewards Checking",
        quote: "Rewards Checking",
        at: "00:15",
        speaker: "Kate",
        transcriptId: "priya-3",
        status: "accepted",
      },
    ],
    activity: [
      event("AO-10390-1", "2026-10-20T08:05:00", "Kate started a new-customer opening at the branch event."),
      event("AO-10390-2", "2026-10-20T08:06:00", "Kate entered Priya Shah and a mobile number."),
      event("AO-10390-3", "2026-10-20T08:07:00", "The conversation detected Rewards Checking and a $500 opening deposit."),
    ],
  });
}

function chrisOpening(): AccountOpening {
  const fields: OpeningFields = {
    ...emptyFields(),
    fullName: sourced("Chris Alvarez", "agent"),
    email: sourced("chris.alvarez@example.com", "agent"),
    phone: sourced("(615) 555-0118", "agent"),
    birthDate: sourced("06/08/1984", "agent"),
    address: sourced("415 Boscobel St, Nashville, TN 37206", "agent"),
    availableFunds: sourced("1000", "conversation"),
    transferAmount: sourced("1000", "conversation"),
    productId: sourced("rewards-checking", "conversation"),
  };
  const opening = baseOpening({
    id: "AO-10344",
    channel: "branch-event",
    relationship: "new",
    status: "opened",
    handoff: "signed",
    startedAt: "2026-10-18T11:12:00",
    openedAt: "2026-10-18T11:24:00",
    fields,
    transcript: [
      { id: "chris-1", at: "00:04", speaker: "kate", text: "Hi, I'm Kate. Are you opening an account today?" },
      { id: "chris-2", at: "00:09", speaker: "customer", text: "Yes. I'm Chris Alvarez. I don't bank here yet, and I want a checking account." },
      { id: "chris-3", at: "00:16", speaker: "kate", text: "Rewards Checking is our everyday account. How much are you depositing to open it?" },
      { id: "chris-4", at: "00:22", speaker: "customer", text: "I brought a thousand dollars in cash." },
      { id: "chris-5", at: "00:27", speaker: "kate", text: "I'll open Rewards Checking with that thousand dollars. The application is filled in, so we can confirm it and sign here." },
      { id: "chris-6", at: "00:34", speaker: "customer", text: "Perfect. Let's do it." },
    ],
    insights: [
      {
        id: "chris-available",
        field: "availableFunds",
        value: "1000",
        displayValue: "$1,000 available",
        quote: "a thousand dollars",
        at: "00:22",
        speaker: "Customer",
        transcriptId: "chris-4",
        status: "accepted",
      },
      {
        id: "chris-amount",
        field: "transferAmount",
        value: "1000",
        displayValue: "$1,000 to open",
        quote: "a thousand dollars",
        at: "00:22",
        speaker: "Customer",
        transcriptId: "chris-4",
        status: "accepted",
      },
      {
        id: "chris-product",
        field: "productId",
        value: "rewards-checking",
        displayValue: "Rewards Checking",
        quote: "Rewards Checking",
        at: "00:16",
        speaker: "Kate",
        transcriptId: "chris-3",
        status: "accepted",
      },
    ],
    activity: [
      event("AO-10344-1", "2026-10-18T11:12:00", "Kate entered Chris Alvarez as a new customer at the branch event."),
      event("AO-10344-2", "2026-10-18T11:18:00", "Kate handed Chris the prefilled application."),
      event("AO-10344-3", "2026-10-18T11:24:00", "Chris confirmed the amount, signed the disclosures, and submitted the application."),
    ],
  });
  opening.newAccountNumber = issuedAccountNumber(opening);
  opening.activity.push(event("AO-10344-4", "2026-10-18T11:24:00", `Opened Rewards Checking ${opening.newAccountNumber} for $1,000.00.`));
  return opening;
}

function helenOpening(): AccountOpening {
  const customer = KNOWN_CUSTOMERS[2];
  const fields = filledSample("40000", "20000", "cd-24", withCustomer(emptyFields(), customer, customer.accountNumber));
  const opening = baseOpening({
    id: "AO-10288",
    channel: "call-center",
    relationship: "existing",
    status: "opened",
    handoff: "signed",
    startedAt: "2026-10-12T13:02:00",
    openedAt: "2026-10-12T13:21:00",
    fields,
    transcript: [
      { id: "helen-1", at: "00:03", speaker: "kate", text: "Thank you for calling SouthEast Bank, this is Kate. Who do I have the pleasure of speaking with?" },
      { id: "helen-2", at: "00:08", speaker: "customer", text: "This is Helen Brooks." },
      { id: "helen-3", at: "00:12", speaker: "kate", text: "Hi Helen. How can I help you today?" },
      {
        id: "helen-4",
        at: "00:16",
        speaker: "customer",
        text: "I have about forty thousand dollars set aside, and I want to lock twenty thousand of it away for a couple of years.",
      },
      { id: "helen-5", at: "00:25", speaker: "kate", text: "Our twenty-four-month CD is paying 3.90 percent APY. Would you like the twenty thousand in that one?" },
      { id: "helen-6", at: "00:33", speaker: "customer", text: "Yes. Put the twenty thousand in the twenty-four-month CD. I won't need it before then." },
      { id: "helen-7", at: "00:40", speaker: "kate", text: "I'll email you the application so you can confirm the amount, sign the disclosures, and submit." },
    ],
    insights: [
      {
        id: "helen-available",
        field: "availableFunds",
        value: "40000",
        displayValue: "$40,000 available",
        quote: "forty thousand dollars",
        at: "00:16",
        speaker: "Customer",
        transcriptId: "helen-4",
        status: "accepted",
      },
      {
        id: "helen-amount",
        field: "transferAmount",
        value: "20000",
        displayValue: "$20,000 to open",
        quote: "twenty thousand",
        at: "00:16",
        speaker: "Customer",
        transcriptId: "helen-4",
        status: "accepted",
      },
      {
        id: "helen-product",
        field: "productId",
        value: "cd-24",
        displayValue: "24-Month CD",
        quote: "twenty-four-month CD",
        at: "00:33",
        speaker: "Customer",
        transcriptId: "helen-6",
        status: "accepted",
      },
    ],
    activity: [
      event("AO-10288-1", "2026-10-12T13:05:00", "Kate entered account 0048066118. Customer profile verified for Helen Brooks."),
      event("AO-10288-2", "2026-10-12T13:12:00", "Application emailed to helen.brooks@example.com."),
      event("AO-10288-3", "2026-10-12T13:21:00", "Helen confirmed the amount, signed the disclosures, and submitted the application."),
    ],
  });
  opening.newAccountNumber = issuedAccountNumber(opening);
  opening.activity.push(event("AO-10288-4", "2026-10-12T13:21:00", `Opened 24-Month CD ${opening.newAccountNumber} for $20,000.00.`));
  return opening;
}

export const seedAccountOpenings: AccountOpening[] = [
  jordanOpening(),
  priyaOpening(),
  mayaOpening(),
  chrisOpening(),
  helenOpening(),
];

export function isAccountOpening(value: unknown): value is AccountOpening {
  if (!value || typeof value !== "object") return false;
  const opening = value as AccountOpening;
  return Boolean(
    typeof opening.id === "string" &&
      opening.fields?.fullName &&
      opening.fields.productId &&
      Array.isArray(opening.insights) &&
      Array.isArray(opening.transcript) &&
      Array.isArray(opening.activity),
  );
}
