"use client";

import { useEffect, useState } from "react";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { Select } from "@/components/ui/Dropdown";
import {
  channelLabel,
  disclosuresFor,
  fieldLabel,
  handoffStep,
  handoffSteps,
  missingSendRequirements,
  parseMoney,
  productById,
  productQuote,
  PRODUCTS,
  statusLabel,
} from "@/lib/account-opening-data";
import { money, percent, shortDate } from "@/lib/format";
import {
  acceptAllInsights,
  acceptInsight,
  dismissInsight,
  setOpeningChannel,
  updateOpeningField,
  useAccountOpening,
  restoreProfileValue,
} from "@/lib/account-opening-store";
import type { AccountOpening, AccountOpeningChannel, OpeningField } from "@/lib/account-opening-types";
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

  if (!opening) return <p className="uw-page-status">Account opening {id} was not found.</p>;

  const locked = opening.status === "opened";
  const suggested = opening.insights.filter((insight) => insight.status === "suggested");
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

  function replayCall() {
    setSection("transcript");
    setShownLines(0);
    setTypedCharacters(0);
    setReplaying(true);
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
          />
          <section className="flex min-w-0 flex-col border-t border-gray-light min-[1100px]:flex-1 min-[1100px]:border-t-0 min-[1100px]:border-l">
            <PanelHeader
              action={
                replaying ? (
                  <span className="text-sm text-primary">Updating from Twilio…</span>
                ) : suggested.length > 0 && !locked ? (
                  <button className="uw-btn-link" type="button" onClick={() => acceptAllInsights(opening.id)}>
                    Add all
                  </button>
                ) : null
              }
            >
              Product Details
            </PanelHeader>
            <div className="grid gap-md p-lg">
              <FundingField
                opening={opening}
                field="productId"
                value={replayValue("productId")}
                highlighted={replaying && currentFields.has("productId")}
                locked={locked || replaying}
              />
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
      moneyInput={field !== "productId"}
      readOnly={locked}
      onChange={(value) => updateOpeningField(opening.id, field, value)}
    />
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
}: {
  opening: AccountOpening;
  locked: boolean;
  replaying: boolean;
  shownLines: number;
  typedCharacters: number;
  onReplay: () => void;
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
  const status =
    opening.transcript.length === 0
      ? "Twilio · waiting for the call"
      : replaying
        ? "Twilio real-time transcription · live"
        : "Twilio real-time transcription";
  return (
    <section className="flex min-w-0 flex-1 flex-col border-b border-gray-light min-[1100px]:border-b-0">
      <PanelHeader
        action={
          <span className="flex items-center gap-md">
            <span className={`text-sm ${replaying ? "text-primary" : "text-gray-medium"}`}>{status}</span>
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
          {replaying ? "Call connected. Waiting for Twilio to return the first words…" : "No conversation yet."}
        </p>
      ) : (
        <ul aria-live="polite">
          {lines.map((line) => {
            const pending = line.partial
              ? []
              : opening.insights.filter((insight) => insight.transcriptId === line.id && insight.status === "suggested");
            return (
              <li key={line.id} className="border-b border-gray-light px-lg py-md">
                <p className="text-xs text-gray-medium">{line.at} · {line.speaker === "kate" ? "Kate" : "Customer"}</p>
                <p className="mt-xs text-sm text-black">
                  {highlightTranscript(
                    line.text,
                    opening.insights.filter((insight) => !insight.id.startsWith("sample-")).map((insight) => insight.quote),
                  )}
                  {line.partial ? <span className="ml-[1px] text-primary">▍</span> : null}
                </p>
                {pending.length > 0 && !locked ? (
                  <div className="mt-sm flex flex-col items-start gap-xs">
                    {pending.map((insight) => (
                      <span key={insight.id} className="flex flex-wrap items-center gap-sm">
                        <button className="uw-btn-link" type="button" onClick={() => acceptInsight(opening.id, insight.id)}>
                          Add {insight.displayValue}
                        </button>
                        <button className="uw-btn-link" type="button" onClick={() => dismissInsight(opening.id, insight.id)}>
                          Dismiss
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
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
          <StepDetail opening={opening} current={current} missing={missing} />
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

function StepDetail({ opening, current, missing }: { opening: AccountOpening; current: number; missing: string[] }) {
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
  if (current === 4 && opening.newAccountNumber) {
    return <p className="text-sm text-black">New account {opening.newAccountNumber}</p>;
  }
  return null;
}

