export type AccountOpeningChannel = "call-center" | "branch-event";

export type AccountOpeningStatus = "in-progress" | "awaiting-signature" | "opened";

export type FieldSource = "agent" | "conversation" | "profile";

export type HandoffStatus = "not-sent" | "sent" | "reviewing" | "signed";

export type InsightStatus = "suggested" | "accepted" | "dismissed";

export const OPENING_FIELDS = [
  "accountNumber",
  "customerId",
  "existingAccount",
  "fullName",
  "email",
  "phone",
  "birthDate",
  "address",
  "availableFunds",
  "transferAmount",
  "productId",
] as const;

export type OpeningField = (typeof OPENING_FIELDS)[number];

export type SourcedValue = {
  value: string;
  source: FieldSource;
  profileValue?: string;
};

export type OpeningFields = Record<OpeningField, SourcedValue>;

export type TranscriptSpeaker = "customer" | "kate";

export type TranscriptLine = {
  id: string;
  at: string;
  speaker: TranscriptSpeaker;
  text: string;
};

export type ConversationInsight = {
  id: string;
  field: OpeningField;
  value: string;
  displayValue: string;
  quote: string;
  at: string;
  speaker: "Customer" | "Kate";
  transcriptId: string;
  status: InsightStatus;
};

export type ActivityEvent = {
  id: string;
  at: string;
  text: string;
};

export type AccountOpening = {
  id: string;
  agentName: string;
  channel: AccountOpeningChannel;
  relationship: "existing" | "new";
  status: AccountOpeningStatus;
  startedAt: string;
  openedAt: string | null;
  newAccountNumber: string | null;
  handoff: HandoffStatus;
  fields: OpeningFields;
  transcript: TranscriptLine[];
  insights: ConversationInsight[];
  activity: ActivityEvent[];
};

export type DepositProduct = {
  id: string;
  name: string;
  termMonths: number;
  apy: number;
  kind: "cd" | "checking";
};

export type KnownCustomer = {
  accountNumber: string;
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  existingAccount: string;
};

export type CreateAccountOpeningInput = {
  channel: AccountOpeningChannel;
  relationship: "existing" | "new";
  accountNumber: string;
  fullName: string;
  phone: string;
  email: string;
  attachSampleCall: boolean;
};
