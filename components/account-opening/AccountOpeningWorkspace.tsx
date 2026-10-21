"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import {
  BRANCHES,
  branchName,
  channelLabel,
  disclosuresFor,
  emptyCallIntake,
  fieldLabel,
  formatPostalAddress,
  lineCapture,
  handoffStep,
  handoffSteps,
  missingSendRequirements,
  parseMoney,
  parsePostalAddress,
  productById,
  productQuote,
  replayCapture,
  PRODUCTS,
  statusLabel,
  type CaptureField,
} from "@/lib/account-opening-data";
import { money, percent, shortDate } from "@/lib/format";
import {
  acceptAllInsights,
  acceptInsight,
  loadSampleCall,
  setOpeningBranch,
  setOpeningCallIntake,
  setOpeningChannel,
  updateOpeningField,
  useAccountOpening,
  restoreProfileValue,
} from "@/lib/account-opening-store";
import type { AccountOpening, AccountOpeningChannel, CallIntake, OpeningField, YesNo } from "@/lib/account-opening-types";

const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
import { ProvenanceField } from "./ProvenanceField";

type SectionId = "transcript" | "activity" | "customer" | "disclosures";

const TABS: { id: SectionId; label: string }[] = [
  { id: "transcript", label: "Transcript" },
  { id: "customer", label: "Profile" },
  { id: "disclosures", label: "Status" },
  { id: "activity", label: "Activity Log" },
];

export function AccountOpeningWorkspace({ id }: { id: string }) {
  const opening = useAccountOpening(id);
  const [section, setSection] = useState<SectionId>("transcript");
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [shownLines, setShownLines] = useState(0);
  const [typedCharacters, setTypedCharacters] = useState(0);
  const transcriptLength = opening?.transcript.length ?? 0;

  useEffect(() => {
    if (!replaying || !opening) return;
    if (shownLines >= transcriptLength) {
      const timer = window.setTimeout(() => setReplaying(false), 900);
      return () => window.clearTimeout(timer);
    }

    const line = opening.transcript[shownLines];
    if (!line) return;

    if (typedCharacters < line.text.length) {
      const timer = window.setTimeout(
        () => setTypedCharacters((current) => Math.min(current + 2, line.text.length)),
        typedCharacters === 0 ? 350 : 22,
      );
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      opening.insights
        .filter((insight) => insight.transcriptId === line.id)
        .forEach((insight) => acceptInsight(opening.id, insight.id));
      setShownLines((current) => current + 1);
      setTypedCharacters(0);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [opening, replaying, shownLines, transcriptLength, typedCharacters]);

  const captureHighlight =
    replaying && opening ? [...replayCapture(opening.transcript, shownLines).highlight].join("|") : "";

  const pendingInsights = !replaying && opening?.insights.some((insight) => insight.status === "suggested");

  useEffect(() => {
    if (!opening || !pendingInsights || opening.status === "opened") return;
    acceptAllInsights(opening.id);
  }, [opening, pendingInsights]);

  useEffect(() => {
    if (!captureHighlight) return;
    const field = captureHighlight.split("|")[0];
    document.querySelector(`[data-capture-field="${field}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [captureHighlight]);

  if (!opening) return <p className="uw-page-status">Account opening {id} was not found.</p>;

  const locked = opening.status === "opened";
  const replayedTranscript = opening.transcript.slice(0, shownLines);
  const detectedDuringReplay = opening.insights.filter((insight) =>
    replayedTranscript.some((line) => line.id === insight.transcriptId),
  );
  const replayValue = (field: "availableFunds" | "transferAmount" | "productId") =>
    replaying ? detectedDuringReplay.find((insight) => insight.field === field)?.value ?? "" : opening.fields[field].value;
  const currentLine = replaying && shownLines > 0 ? opening.transcript[shownLines - 1] : null;
  const currentFields = new Set(
    opening.insights.filter((insight) => insight.transcriptId === currentLine?.id).map((insight) => insight.field),
  );
  const liveCapture = replaying ? replayCapture(opening.transcript, shownLines) : null;
  const branchValue = liveCapture ? liveCapture.branchId : opening.branchId;

  function replayCall() {
    setSection("transcript");
    setShownLines(0);
    setTypedCharacters(0);
    setReplaying(true);
  }

  function startTranscription() {
    if (opening && opening.transcript.length === 0) loadSampleCall(opening.id);
    replayCall();
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SectionTabs label="Account opening sections" current={section} tabs={TABS} onSelect={(next) => setSection(next as SectionId)} />
      {section === "transcript" ? (
        <div className="flex min-h-full flex-col min-[1100px]:flex-row min-[1100px]:items-stretch">
          <Conversation
            opening={opening}
            locked={locked}
            replaying={replaying}
            shownLines={replaying ? shownLines : opening.transcript.length}
            typedCharacters={typedCharacters}
            onReplay={replayCall}
            onStart={startTranscription}
          />
          <section className="flex min-w-0 flex-col border-t border-gray-light min-[1100px]:flex-1 min-[1100px]:border-t-0 min-[1100px]:border-l">
            <PanelHeader action={replaying ? <span className="text-sm text-primary">Updating from the call…</span> : null}>
              Application Details
            </PanelHeader>
            <div className="grid gap-md p-lg">
              <FundingField
                opening={opening}
                field="productId"
                value={replayValue("productId")}
                highlighted={replaying && currentFields.has("productId")}
                locked={locked || replaying}
              />
              <CapturedField field="branch">
                <Select
                  variant="float"
                  label="Branch"
                  value={branchValue}
                  placeholder="Select a branch"
                  disabled={locked || replaying}
                  highlighted={Boolean(liveCapture?.highlight.has("branch"))}
                  options={BRANCHES.map((branch) => ({ id: branch.id, label: branch.name }))}
                  onChange={(value) => setOpeningBranch(opening.id, value)}
                />
              </CapturedField>
              <FundingField
                opening={opening}
                field="availableFunds"
                value={replayValue("availableFunds")}
                highlighted={replaying && currentFields.has("availableFunds")}
                locked={locked || replaying}
              />
              <FundingField
                opening={opening}
                field="transferAmount"
                value={replayValue("transferAmount")}
                highlighted={replaying && currentFields.has("transferAmount")}
                locked={locked || replaying}
              />
              {opening.relationship === "new" ? (
                <CallDetails opening={opening} disabled={locked || replaying} live={liveCapture} />
              ) : null}
            </div>
            <ProductSummary
              opening={opening}
              amountValue={replayValue("transferAmount")}
              productId={replayValue("productId")}
            />
          </section>
        </div>
      ) : null}
      {section === "activity" ? <Activity opening={opening} /> : null}
      {section === "customer" ? (
        <section className="flex min-w-0 flex-col">
          <PanelHeader
            action={
              locked ? null : (
                <button className="uw-btn-link" type="button" onClick={() => setEditingCustomer((current) => !current)}>
                  {editingCustomer ? "Done" : "Edit"}
                </button>
              )
            }
          >
            Profile
          </PanelHeader>
          <div className="grid gap-y-md p-lg min-[1100px]:w-fit min-[1100px]:grid-cols-[minmax(300px,max-content)_minmax(300px,max-content)] min-[1100px]:gap-x-3xl">
            <ApplicantFields opening={opening} fields={["fullName"]} locked={locked || !editingCustomer} />
            <ReadField label="Customer ID" value={opening.fields.customerId.value || "No profile match"} />
            <ProvenanceField
              id="opening-accountNumber"
              label="Account number"
              value={opening.fields.accountNumber.value}
              readOnly={locked || !editingCustomer}
              onChange={(value) => updateOpeningField(opening.id, "accountNumber", value)}
            />
            <ReadField label="Existing relationship" value={opening.fields.existingAccount.value || "No profile match"} />
            <ReadField label="New account" value={opening.status === "opened" ? opening.newAccountNumber || "TBD" : "TBD"} />
            <ReadField label="Branch" value={branchName(opening.branchId) || "Not assigned"} />
            <ApplicantFields opening={opening} fields={["email", "phone", "birthDate", "address"]} locked={locked || !editingCustomer} />
            {editingCustomer && !locked ? (
              <Select
                variant="float"
                label="Channel"
                value={opening.channel}
                options={[
                  { id: "call-center", label: "Call center" },
                  { id: "branch-event", label: "Branch event / shared tablet" },
                ]}
                onChange={(value) => setOpeningChannel(opening.id, value as AccountOpeningChannel)}
              />
            ) : (
              <ReadField label="Channel" value={channelLabel(opening.channel)} />
            )}
            <div className="flex flex-col gap-xs">
              <span className="text-xs text-gray-medium">Status</span>
              <span className="flex min-h-5 items-center text-sm text-black">{statusLabel(opening.status)}</span>
            </div>
            {opening.relationship === "new" ? <p className="text-sm text-gray-medium">New customer. There is no profile on file.</p> : null}
          </div>
        </section>
      ) : null}
      {section === "disclosures" ? <Disclosures opening={opening} /> : null}
    </div>
  );
}

function ApplicantFields({
  opening,
  fields,
  locked,
}: {
  opening: AccountOpening;
  fields: OpeningField[];
  locked: boolean;
}) {
  return (
    <>
      {fields.map((field) => (
        <ProvenanceField
          key={field}
          id={`opening-${field}`}
          label={fieldLabel(field)}
          value={opening.fields[field].value}
          profileValue={opening.fields[field].profileValue}
          type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
          readOnly={locked}
          onChange={(value) => updateOpeningField(opening.id, field, value)}
          onUseProfile={() => restoreProfileValue(opening.id, field)}
        />
      ))}
    </>
  );
}

function PanelHeader({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div className="uw-card-header">
      <h1 className="text-lg text-black">{children}</h1>
      {action}
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-xs text-gray-medium">{label}</span>
      <span className="flex min-h-5 items-center text-sm text-black">{value || "—"}</span>
    </div>
  );
}

function FundingField({
  opening,
  field,
  value,
  highlighted,
  locked,
}: {
  opening: AccountOpening;
  field: "availableFunds" | "transferAmount" | "productId";
  value?: string;
  highlighted?: boolean;
  locked: boolean;
}) {
  return (
    <ProvenanceField
      id={`opening-${field}`}
      label={fieldLabel(field)}
      value={value ?? opening.fields[field].value}
      options={field === "productId" ? PRODUCTS.map((product) => ({ id: product.id, label: product.name })) : undefined}
      focused={highlighted}
      keepControl
      moneyInput={field !== "productId"}
      readOnly={locked}
      onChange={(value) => updateOpeningField(opening.id, field, value)}
    />
  );
}

function CapturedField({ field, children }: { field: string; children: ReactNode }) {
  return <div data-capture-field={field}>{children}</div>;
}

function CallDetails({
  opening,
  disabled,
  live,
}: {
  opening: AccountOpening;
  disabled: boolean;
  live: ReturnType<typeof replayCapture> | null;
}) {
  const intake = live?.intake ?? opening.callIntake ?? emptyCallIntake();
  const address = parsePostalAddress(live ? live.address : opening.fields.address.value);
  const birthDate = live ? live.birthDate : opening.fields.birthDate.value;
  const active = (field: CaptureField) => Boolean(live?.highlight.has(field));

  function writeIntake(partial: Partial<CallIntake>) {
    setOpeningCallIntake(opening.id, { ...intake, ...partial });
  }

  function writeAddress(partial: Partial<typeof address>) {
    const next = { ...address, ...partial };
    updateOpeningField(opening.id, "address", formatPostalAddress(next.street, next.unit, next.city, next.state, next.zip));
  }

  return (
    <>
      <div data-capture-field="birthDate">
        <ProvenanceField
          id="opening-birthDate"
          label={fieldLabel("birthDate")}
          value={birthDate}
          profileValue={opening.fields.birthDate.profileValue}
          focused={active("birthDate")}
          keepControl
          readOnly={disabled}
          onChange={(value) => updateOpeningField(opening.id, "birthDate", value)}
          onUseProfile={() => restoreProfileValue(opening.id, "birthDate")}
        />
      </div>
      <CapturedField field="street">
        <FloatInput label="Primary street address" value={address.street} readOnly={disabled} quiet={disabled} highlighted={active("street")} onChange={(value) => writeAddress({ street: value })} />
      </CapturedField>
      <CapturedField field="unit">
        <FloatInput label="Unit (optional)" value={address.unit} readOnly={disabled} quiet={disabled} highlighted={active("unit")} onChange={(value) => writeAddress({ unit: value })} />
      </CapturedField>
      <CapturedField field="city">
        <FloatInput label="City" value={address.city} readOnly={disabled} quiet={disabled} highlighted={active("city")} onChange={(value) => writeAddress({ city: value })} />
      </CapturedField>
      <CapturedField field="state">
        <Select variant="float" label="State" value={address.state} options={STATES} disabled={disabled} highlighted={active("state")} onChange={(value) => writeAddress({ state: value })} />
      </CapturedField>
      <CapturedField field="zip">
        <FloatInput label="Zip code" value={address.zip} readOnly={disabled} quiet={disabled} highlighted={active("zip")} onChange={(value) => writeAddress({ zip: value })} />
      </CapturedField>
      <CapturedField field="employer">
        <FloatInput label="Employer" value={intake.employer} readOnly={disabled} quiet={disabled} highlighted={active("employer")} onChange={(value) => writeIntake({ employer: value })} />
      </CapturedField>
      <CapturedField field="occupation">
        <FloatInput label="Occupation" value={intake.occupation} readOnly={disabled} quiet={disabled} highlighted={active("occupation")} onChange={(value) => writeIntake({ occupation: value })} />
      </CapturedField>
      <CapturedField field="pep">
        <Select variant="float" label="Politically exposed" value={intake.pep} options={YES_NO} disabled={disabled} highlighted={active("pep")} onChange={(value) => writeIntake({ pep: value as YesNo })} />
      </CapturedField>
      <CapturedField field="ownership">
        <Select
          variant="float"
          label="Ownership"
          value={intake.ownership}
          disabled={disabled}
          highlighted={active("ownership")}
          options={[
            { id: "Individual", label: "Individual" },
            { id: "Joint", label: "Joint" },
          ]}
          onChange={(value) => writeIntake({ ownership: value as CallIntake["ownership"] })}
        />
      </CapturedField>
      {intake.ownership === "Joint" ? (
        <>
          <FloatInput
            label="Joint owner first name"
            value={intake.jointOwner.firstName}
            readOnly={disabled}
            quiet={disabled}
            onChange={(value) => writeIntake({ jointOwner: { ...intake.jointOwner, firstName: value } })}
          />
          <FloatInput
            label="Joint owner last name"
            value={intake.jointOwner.lastName}
            readOnly={disabled}
            quiet={disabled}
            onChange={(value) => writeIntake({ jointOwner: { ...intake.jointOwner, lastName: value } })}
          />
          <FloatInput
            label="Joint owner email"
            value={intake.jointOwner.email}
            type="email"
            readOnly={disabled}
            quiet={disabled}
            onChange={(value) => writeIntake({ jointOwner: { ...intake.jointOwner, email: value } })}
          />
        </>
      ) : null}
      <CapturedField field="purpose">
        <Select variant="float" label="Purpose of account" value={intake.purpose} disabled={disabled} highlighted={active("purpose")} options={["Personal", "Business", "Savings", "Investment"]} onChange={(value) => writeIntake({ purpose: value })} />
      </CapturedField>
      <CapturedField field="frequency">
        <Select variant="float" label="Expected deposit frequency" value={intake.frequency} disabled={disabled} highlighted={active("frequency")} options={["Weekly", "Bi-weekly", "Monthly", "Quarterly"]} onChange={(value) => writeIntake({ frequency: value })} />
      </CapturedField>
      <CapturedField field="expectedDeposit">
        <Select variant="float" label="Expected deposit" value={intake.expectedDeposit} disabled={disabled} highlighted={active("expectedDeposit")} options={["Employment Income", "Savings", "Investment Income", "Other"]} onChange={(value) => writeIntake({ expectedDeposit: value })} />
      </CapturedField>
      <CapturedField field="movement">
        <Select variant="float" label="Expects deposits or withdrawals" value={intake.movement} options={YES_NO} disabled={disabled} highlighted={active("movement")} onChange={(value) => writeIntake({ movement: value as YesNo })} />
      </CapturedField>
      <CapturedField field="cashIn">
        <Select variant="float" label="Expects cash deposits" value={intake.cashIn} options={YES_NO} disabled={disabled} highlighted={active("cashIn")} onChange={(value) => writeIntake({ cashIn: value as YesNo, cashInAmount: value === "yes" ? intake.cashInAmount : "" })} />
      </CapturedField>
      {intake.cashIn === "yes" ? (
        <CapturedField field="cashInAmount">
          <Select
            variant="float"
            label="Monthly cash deposit volume"
            value={intake.cashInAmount}
            disabled={disabled}
            highlighted={active("cashInAmount")}
            options={["$0 - $1,000", "$1,001 - $3,000", "$3,001 - $5,000", "$5,001 - $10,000", "$10,001+"]}
            onChange={(value) => writeIntake({ cashInAmount: value })}
          />
        </CapturedField>
      ) : null}
      <CapturedField field="cashOut">
        <Select variant="float" label="Expects cash withdrawals" value={intake.cashOut} options={YES_NO} disabled={disabled} highlighted={active("cashOut")} onChange={(value) => writeIntake({ cashOut: value as YesNo })} />
      </CapturedField>
      <CapturedField field="ach">
        <Select variant="float" label="Expects ACH transfers" value={intake.ach} options={YES_NO} disabled={disabled} highlighted={active("ach")} onChange={(value) => writeIntake({ ach: value as YesNo })} />
      </CapturedField>
      <CapturedField field="wire">
        <Select variant="float" label="Expects wire transfers" value={intake.wire} options={YES_NO} disabled={disabled} highlighted={active("wire")} onChange={(value) => writeIntake({ wire: value as YesNo })} />
      </CapturedField>
    </>
  );
}

function ProductSummary({
  opening,
  amountValue = opening.fields.transferAmount.value,
  productId = opening.fields.productId.value,
}: {
  opening: AccountOpening;
  amountValue?: string;
  productId?: string;
}) {
  const product = productById(productId);
  const amount = parseMoney(amountValue);
  if (!product || amount == null) return null;
  const quote = productQuote(amount, product);
  const rows = [
    ["APY", percent(product.apy)],
    ["Term", quote.termLabel],
    ...(quote.interest != null ? [["Estimated interest", money(quote.interest)]] : []),
    ...(quote.maturity != null ? [["Estimated value at maturity", money(quote.maturity)]] : []),
  ];
  return (
    <dl className="flex flex-col gap-md border-t border-gray-light p-lg">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-xs">
          <dt className="text-xs text-gray-medium">{label}</dt>
          <dd className="text-sm text-black">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Conversation({
  opening,
  locked,
  replaying,
  shownLines,
  typedCharacters,
  onReplay,
  onStart,
}: {
  opening: AccountOpening;
  locked: boolean;
  replaying: boolean;
  shownLines: number;
  typedCharacters: number;
  onReplay: () => void;
  onStart: () => void;
}) {
  const lines = opening.transcript.slice(0, shownLines).map((line) => ({ ...line, partial: false }));
  const activeLine = replaying ? opening.transcript[shownLines] : null;
  if (activeLine && typedCharacters > 0) {
    lines.push({
      ...activeLine,
      text: activeLine.text.slice(0, typedCharacters),
      partial: true,
    });
  }
  const status = replaying ? "Transcribing…" : "Transcript";
  return (
    <section className="flex min-w-0 flex-1 flex-col border-b border-gray-light min-[1100px]:border-b-0">
      <PanelHeader
        action={
          <span className="flex items-center gap-md">
            {opening.transcript.length === 0 && !locked ? (
              <button className="uw-btn-link" type="button" onClick={onStart}>
                Start transcription
              </button>
            ) : (
              <span className={`text-sm ${replaying ? "text-primary" : "text-gray-medium"}`}>{status}</span>
            )}
            {opening.transcript.length > 0 && !locked ? (
              <button className="uw-btn-link" type="button" disabled={replaying} onClick={onReplay}>
                Replay live call
              </button>
            ) : null}
          </span>
        }
      >
        Transcript
      </PanelHeader>
      {lines.length === 0 ? (
        <p className="p-lg text-sm text-gray-medium">
          {replaying ? "Starting transcription…" : "No conversation yet."}
        </p>
      ) : (
        <ul aria-live="polite">
          {lines.map((line) => (
              <li key={line.id} className="border-b border-gray-light px-lg py-md">
                <p className="text-xs text-gray-medium">{line.at} · {line.speaker === "kate" ? "Kate" : "Customer"}</p>
                <p className="mt-xs text-sm text-black">
                  {highlightTranscript(line.text, [
                    ...opening.insights.filter((insight) => !insight.id.startsWith("sample-")).map((insight) => insight.quote),
                    lineCapture(line.id)?.quote ?? "",
                  ])}
                  {line.partial ? <span className="ml-[1px] text-primary">▍</span> : null}
                </p>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function highlightTranscript(text: string, quotes: string[] = []) {
  const phrases = [...quotes, "fifty thousand dollars", "fifteen thousand", "twelve-month CD", "4.25 percent APY"]
    .map((phrase) => phrase.trim())
    .filter((phrase, index, all) => phrase.length > 2 && all.indexOf(phrase) === index)
    .sort((left, right) => right.length - left.length);
  if (phrases.length === 0) return text;
  const source = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const splitter = new RegExp(`(${source})`, "gi");
  const exact = new RegExp(`^(?:${source})$`, "i");
  return text.split(splitter).map((part, index) =>
    exact.test(part) ? (
      <mark key={`${part}-${index}`} className="rounded-xs bg-warning-bg px-[2px] text-black">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function Activity({ opening }: { opening: AccountOpening }) {
  return (
    <section className="flex min-w-0 flex-col">
      <PanelHeader>Activity Log</PanelHeader>
      <ul>
        {[...opening.activity].reverse().map((item) => (
          <li key={item.id} className="border-b border-gray-light px-lg py-md">
            <p className="text-xs text-gray-medium">{shortDate(item.at)}</p>
            <p className="mt-xs text-sm text-black">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Disclosures({ opening }: { opening: AccountOpening }) {
  const missing = missingSendRequirements(opening);
  const steps = handoffSteps(opening.channel);
  const current = handoffStep(opening);
  const disclosures = disclosuresFor(opening.fields.productId.value);
  return (
    <div className="flex min-h-full flex-col">
      <section className="flex min-w-0 flex-col">
        <PanelHeader>Status</PanelHeader>
        <div className="flex flex-col gap-lg p-lg">
          <ol className="grid grid-cols-5">
            {steps.map((step, index) => {
              const finished = opening.status === "opened";
              const done = index < current || finished;
              const active = index === current && !finished;
              return (
                <li key={step} className="flex min-w-0 flex-col items-center gap-sm text-center" aria-current={active ? "step" : undefined}>
                  <div className="relative flex h-8 w-full items-center justify-center">
                    {index > 0 ? (
                      <span className={`absolute top-1/2 right-1/2 left-0 h-px ${done || active ? "bg-primary" : "bg-gray-light"}`} />
                    ) : null}
                    {index < steps.length - 1 ? (
                      <span className={`absolute top-1/2 left-1/2 right-0 h-px ${done ? "bg-primary" : "bg-gray-light"}`} />
                    ) : null}
                    <span
                      className={`relative flex size-8 items-center justify-center rounded-full border text-sm ${
                        done || active ? "border-primary bg-primary text-white" : "border-gray-light bg-white text-gray-medium"
                      }`}
                    >
                      {done ? <StepCheck /> : index + 1}
                    </span>
                  </div>
                  <span className={`px-xs text-sm ${active ? "font-semibold text-primary" : done ? "text-black" : "text-gray-medium"}`}>{step}</span>
                </li>
              );
            })}
          </ol>
          <StepDetail current={current} missing={missing} />
        </div>
      </section>
      <section className="flex min-w-0 flex-col border-t border-gray-light">
        <PanelHeader>Status Details</PanelHeader>
        {disclosures.length === 0 ? null : (
          <table className="uw-case-docs">
            <thead>
              <tr>
                <th>Disclosure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disclosures.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.title}
                    <div className="text-gray-medium">{item.detail}</div>
                  </td>
                  <td>{opening.status === "opened" ? "Signed" : "Waiting on customer"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StepCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.2l2.4 2.4 4.6-5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepDetail({ current, missing }: { current: number; missing: string[] }) {
  if (current === 0 && missing.length > 0) {
    return (
      <div>
        <p className="text-sm text-gray-medium">Still needed before the application can be sent:</p>
        <ul className="list-disc pl-lg text-sm text-gray-dark">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

