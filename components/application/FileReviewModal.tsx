"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  FILE_REVIEW_STATUSES,
  FILE_REVIEW_TYPES,
  LOAN_STATEMENT,
  QUALIFIED_TIERS,
  QUALIFIED_TO,
  SERVICERS,
  fileReviewDefaults,
  fileReviewType,
  type FileReviewTypeId,
} from "@/lib/file-review";
import type { Application, FileReview } from "@/lib/types";

export function FileReviewModal({
  open,
  application,
  onSave,
  onClose,
}: {
  open: boolean;
  application: Application;
  onSave: (review: FileReview) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"type" | "form">("type");
  const [typeId, setTypeId] = useState<FileReviewTypeId>(FILE_REVIEW_TYPES[0].id);
  const [draft, setDraft] = useState<FileReview | null>(null);
  const [nameError, setNameError] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setTypeId(FILE_REVIEW_TYPES[0].id);
    setDraft(null);
    setNameError(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const type = fileReviewType(typeId);
  const form = draft ?? fileReviewDefaults(application, typeId);

  function setField<K extends keyof FileReview>(key: K, value: FileReview[K]) {
    setDraft((current) => ({ ...(current ?? form), [key]: value }));
  }

  function goToForm() {
    const defaults = fileReviewDefaults(application, typeId);
    const saved =
      application.fileReview?.recordTypeId === typeId ? application.fileReview : null;
    setDraft(saved ? { ...defaults, ...saved, recordType: type.label } : defaults);
    setNameError(false);
    setStep("form");
  }

  function save(andNew: boolean) {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    onSave({ ...form, savedAt: new Date().toISOString() });
    if (andNew) {
      setStep("type");
      setTypeId(FILE_REVIEW_TYPES[0].id);
      setDraft(null);
      setNameError(false);
      return;
    }
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-xl">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/40"
        aria-label="Close file review"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`uw-dialog ${step === "form" ? "uw-dialog-review-form" : "uw-dialog-review"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-md border-b border-gray-light px-xl py-md">
          <h2 id={titleId} className="flex-1 text-center text-lg font-semibold text-charcoal">
            {step === "type" ? "New File Review" : `New File Review: ${type.label}`}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs text-gray-dark hover:bg-gray-lightest"
          >
            <CloseIcon />
          </button>
        </div>

        {step === "type" ? (
          <>
            <div className="flex gap-3xl overflow-y-auto px-[56px] py-xl">
              <p className="w-[140px] shrink-0 pt-xs text-sm text-gray-medium">Select a record type</p>
              <fieldset className="flex min-w-0 flex-1 flex-col gap-md">
                <legend className="sr-only">File review record type</legend>
                {FILE_REVIEW_TYPES.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-start gap-md">
                    <input
                      type="radio"
                      name="file-review-type"
                      checked={typeId === item.id}
                      onChange={() => setTypeId(item.id)}
                      className="mt-[3px] size-4 accent-primary"
                    />
                    <span>
                      <span className="block text-sm text-charcoal">{item.label}</span>
                      {item.detail ? (
                        <span className="block text-xs text-gray-medium">{item.detail}</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
            <div className="flex shrink-0 justify-end gap-sm border-t border-gray-light px-xl py-md">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={goToForm}>Next</Button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="px-xl pt-md text-right text-xs text-gray-medium">
                <span className="text-error">*</span> = Required Information
              </p>
              <Section title="Information">
                <Field
                  label="File Review Name"
                  required
                  error={nameError}
                  value={form.name}
                  onChange={(name) => {
                    setNameError(false);
                    setField("name", name);
                  }}
                />
                <OwnerField name={form.owner} />
                <OpportunityField
                  label={form.opportunityLabel}
                  onClear={() => setField("opportunityLabel", "")}
                />
                <ReadField label="Record Type" value={form.recordType} />
                <SelectField
                  label="File Review Status"
                  value={form.status}
                  options={FILE_REVIEW_STATUSES}
                  onChange={(status) => setField("status", status)}
                />
                <Field
                  label="Underwriter Look Up"
                  value={form.underwriter}
                  onChange={(underwriter) => setField("underwriter", underwriter)}
                  search
                />
              </Section>
              <Section title="Loan Information">
                <SelectField
                  label="Qualified to"
                  value={form.qualifiedTo}
                  options={QUALIFIED_TO}
                  onChange={(qualifiedTo) => setField("qualifiedTo", qualifiedTo)}
                />
                <SelectField
                  label="Qualified Tier"
                  required
                  value={form.qualifiedTier}
                  options={QUALIFIED_TIERS}
                  onChange={(qualifiedTier) => setField("qualifiedTier", qualifiedTier)}
                />
                <Field
                  label="Qualified Rate"
                  value={form.qualifiedRate}
                  onChange={(qualifiedRate) => setField("qualifiedRate", qualifiedRate)}
                />
                <SelectField
                  label="Loan Statement Included & Compliant"
                  value={form.loanStatementCompliant}
                  options={LOAN_STATEMENT}
                  onChange={(loanStatementCompliant) => setField("loanStatementCompliant", loanStatementCompliant)}
                />
                <Field
                  label="Loan Amount"
                  value={form.loanAmount}
                  onChange={(loanAmount) => setField("loanAmount", loanAmount)}
                />
                <SelectField
                  label="Suggested Servicer"
                  value={form.suggestedServicer}
                  options={
                    SERVICERS.includes(form.suggestedServicer)
                      ? SERVICERS
                      : [form.suggestedServicer, ...SERVICERS]
                  }
                  onChange={(suggestedServicer) => setField("suggestedServicer", suggestedServicer)}
                />
                <Field
                  label="Term"
                  value={form.term}
                  onChange={(term) => setField("term", term)}
                />
                <CheckField
                  label="Servicer Override PHEAA"
                  checked={form.servicerOverridePheaa}
                  onChange={(servicerOverridePheaa) => setField("servicerOverridePheaa", servicerOverridePheaa)}
                  tip="Overrides the suggested servicer to PHEAA."
                />
                <Field
                  label="Rate Type"
                  value={form.rateType}
                  onChange={(rateType) => setField("rateType", rateType)}
                />
                <CheckField
                  label="Servicer Override MOHELA"
                  checked={form.servicerOverrideMohela}
                  onChange={(servicerOverrideMohela) => setField("servicerOverrideMohela", servicerOverrideMohela)}
                  tip="Overrides the suggested servicer to MOHELA."
                />
              </Section>
              <Section title="Applicant Information">
                <Field
                  label="Applicant Name"
                  value={form.applicantName}
                  onChange={(applicantName) => setField("applicantName", applicantName)}
                />
                <Field
                  label="Social Security Number"
                  value={form.ssn}
                  onChange={(ssn) => setField("ssn", ssn)}
                />
                <Field
                  label="Date of Birth"
                  value={form.birthDate}
                  onChange={(birthDate) => setField("birthDate", birthDate)}
                />
                <Field
                  label="Citizenship"
                  value={form.citizenship}
                  onChange={(citizenship) => setField("citizenship", citizenship)}
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(phone) => setField("phone", phone)}
                />
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(email) => setField("email", email)}
                />
                <Field
                  label="Street"
                  value={form.street}
                  onChange={(street) => setField("street", street)}
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(city) => setField("city", city)}
                />
                <Field
                  label="State"
                  value={form.state}
                  onChange={(state) => setField("state", state)}
                />
                <Field
                  label="ZIP"
                  value={form.zip}
                  onChange={(zip) => setField("zip", zip)}
                />
                <Field
                  label="Living Arrangement"
                  value={form.livingArrangement}
                  onChange={(livingArrangement) => setField("livingArrangement", livingArrangement)}
                />
                <Field
                  label="FICO"
                  value={form.fico}
                  onChange={(fico) => setField("fico", fico)}
                />
                <Field
                  label="Degree"
                  value={form.degree}
                  onChange={(degree) => setField("degree", degree)}
                />
                <Field
                  label="School"
                  value={form.school}
                  onChange={(school) => setField("school", school)}
                />
                <Field
                  label="Graduation Year"
                  value={form.graduationYear}
                  onChange={(graduationYear) => setField("graduationYear", graduationYear)}
                />
                <Field
                  label="Annual Income"
                  value={form.annualIncome}
                  onChange={(annualIncome) => setField("annualIncome", annualIncome)}
                />
                <Field
                  label="Monthly Income"
                  value={form.monthlyIncome}
                  onChange={(monthlyIncome) => setField("monthlyIncome", monthlyIncome)}
                />
                <Field
                  label="Housing Payment"
                  value={form.housingPayment}
                  onChange={(housingPayment) => setField("housingPayment", housingPayment)}
                />
                <Field
                  label="DTI"
                  value={form.dti}
                  onChange={(dti) => setField("dti", dti)}
                />
                <Field
                  label="Employment Status"
                  value={form.employmentStatus}
                  onChange={(employmentStatus) => setField("employmentStatus", employmentStatus)}
                />
                <Field
                  label="Employer"
                  value={form.employer}
                  onChange={(employer) => setField("employer", employer)}
                />
              </Section>
              {type.cosigner ? (
                <Section title="Co-Applicant Information">
                  <Field
                    label="Cosigner Name"
                    value={form.cosignerName}
                    onChange={(cosignerName) => setField("cosignerName", cosignerName)}
                  />
                  <Field
                    label="Cosigner Email"
                    value={form.cosignerEmail}
                    onChange={(cosignerEmail) => setField("cosignerEmail", cosignerEmail)}
                  />
                  <Field
                    label="Relationship"
                    value={form.cosignerRelationship}
                    onChange={(cosignerRelationship) => setField("cosignerRelationship", cosignerRelationship)}
                  />
                </Section>
              ) : null}
            </div>
            <div className="flex shrink-0 justify-end gap-sm border-t border-gray-light px-xl py-md">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => save(true)}>
                Save & New
              </Button>
              <Button onClick={() => save(false)}>Save</Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="bg-gray-lightest px-xl py-sm text-sm font-semibold text-charcoal">{title}</h3>
      <div className="grid grid-cols-1 gap-x-3xl gap-y-lg px-xl py-lg md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  error,
  search,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  search?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-xs">
      <span className="text-xs text-gray-medium">
        {required ? <span className="text-error">* </span> : null}
        {label}
      </span>
      <span className="relative">
        <input
          value={value}
          aria-invalid={error || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`h-8 w-full rounded-xs border bg-white px-sm text-sm text-black outline-none focus:border-primary ${
            error ? "border-error" : "border-gray-light"
          } ${search ? "pr-8" : ""}`}
        />
        {search ? (
          <span className="pointer-events-none absolute top-1/2 right-sm -translate-y-1/2 text-gray-medium">
            <SearchIcon />
          </span>
        ) : null}
      </span>
      {error ? <span className="text-xs text-error">Complete this field.</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-xs">
      <span className="text-xs text-gray-medium">
        {required ? <span className="text-error">* </span> : null}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-xs border border-gray-light bg-white px-sm text-sm text-black outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <p className="text-xs text-gray-medium">{label}</p>
      <p className="flex h-8 items-center text-sm text-charcoal">{value}</p>
    </div>
  );
}

function OwnerField({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <p className="text-xs text-gray-medium">Owner</p>
      <p className="flex h-8 items-center gap-sm text-sm text-charcoal">
        <span
          aria-hidden
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-bg text-[10px] font-semibold text-primary"
        >
          {initials}
        </span>
        {name}
      </p>
    </div>
  );
}

function OpportunityField({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <p className="text-xs text-gray-medium">Opportunity</p>
      {label ? (
        <span className="flex h-8 items-center">
          <span className="inline-flex max-w-full items-center gap-xs rounded-xs bg-primary-bg py-px pr-xs pl-px">
            <span
              aria-hidden
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-[2px] bg-orange text-white"
            >
              <OpportunityIcon />
            </span>
            <span className="truncate text-sm text-primary">{label}</span>
            <button
              type="button"
              aria-label="Clear opportunity"
              onClick={onClear}
              className="inline-flex size-5 shrink-0 items-center justify-center text-gray-medium hover:text-charcoal"
            >
              <CloseIcon />
            </button>
          </span>
        </span>
      ) : (
        <input
          aria-label="Opportunity"
          className="h-8 w-full rounded-xs border border-gray-light bg-white px-sm text-sm text-black outline-none focus:border-primary"
        />
      )}
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
  tip,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  tip: string;
}) {
  return (
    <label className="flex min-h-8 items-center gap-sm text-sm text-charcoal">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
      <span className="inline-flex text-gray-medium" title={tip}>
        <InfoIcon />
        <span className="sr-only">{tip}</span>
      </span>
    </label>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function OpportunityIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 9.5V5.2L6 2.5l4 2.7v4.3H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" />
      <path d="M8 7.2v4" stroke="currentColor" strokeLinecap="round" />
      <circle cx="8" cy="5.2" r="0.7" fill="currentColor" />
    </svg>
  );
}
