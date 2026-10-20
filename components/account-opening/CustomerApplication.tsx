"use client";

import { useState } from "react";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { FooterDisclaimer } from "@/components";
import { LoginFlow } from "@/app/LoginFlow";
import loginPage from "@/app/page.module.css";

const gmailFont = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"] });
import { PRODUCTS, disclosuresFor, parseMoney, productById } from "@/lib/account-opening-data";
import { money, percent } from "@/lib/format";
import type { AccountOpening } from "@/lib/account-opening-types";
import {
  markOpeningReviewing,
  completeOpening,
  signOpening,
  updateOpeningField,
  useAccountOpening,
} from "@/lib/account-opening-store";
import "./customer-application.css";

type Screen =
  | "email"
  | "login"
  | "ownership-loading"
  | "ownership"
  | "joint-owner-details"
  | "joint-owner-confirm"
  | "address"
  | "identity"
  | "id-upload"
  | "jobs"
  | "phone"
  | "phone-code"
  | "questionnaire"
  | "bank-details-loading"
  | "initial-deposit"
  | "deposit-amount"
  | "submitting"
  | "review"
  | "submitted-loading"
  | "submitted";

type Answer = "" | "yes" | "no";
type Funding = "" | "internal" | "plaid" | "manual";

type OwnerDraft = {
  first: string;
  middle: string;
  last: string;
  suffix: string;
  productId: string;
  phone: string;
  email: string;
  birthDate: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  idType: string;
  idNumber: string;
  idState: string;
  issueDate: string;
  expirationDate: string;
  uploadedFile: string;
  employer: string;
  occupation: string;
};

const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

const SCREEN_META: Record<Exclude<Screen, "email" | "login" | "submitted-loading" | "submitted">, { section: number; step: number }> = {
  "ownership-loading": { section: 1, step: 1 },
  ownership: { section: 1, step: 1 },
  "joint-owner-details": { section: 1, step: 2 },
  "joint-owner-confirm": { section: 1, step: 3 },
  address: { section: 2, step: 4 },
  identity: { section: 2, step: 5 },
  "id-upload": { section: 2, step: 6 },
  jobs: { section: 2, step: 7 },
  phone: { section: 2, step: 8 },
  "phone-code": { section: 2, step: 9 },
  questionnaire: { section: 3, step: 10 },
  "bank-details-loading": { section: 4, step: 11 },
  "initial-deposit": { section: 4, step: 12 },
  "deposit-amount": { section: 4, step: 12 },
  submitting: { section: 5, step: 13 },
  review: { section: 5, step: 14 },
};

const SECTION_LABELS = ["Application Ownership", "About You", "Account Security", "Bank Details", "Summary"];

export function CustomerApplication({ id, startAtLogin = false }: { id: string; startAtLogin?: boolean }) {
  const opening = useAccountOpening(id);

  if (!opening) {
    return <div className="customer-application customer-application-message">Application {id} was not found.</div>;
  }

  return <CustomerApplicationFlow key={opening.id} opening={opening} startAtLogin={startAtLogin} />;
}

function CustomerApplicationFlow({ opening, startAtLogin }: { opening: AccountOpening; startAtLogin: boolean }) {
  const id = opening.id;
  const initialAddress = parseAddress(opening.fields.address.value);
  const initialAmount = parseMoney(opening.fields.transferAmount.value);
  const [screen, setScreen] = useState<Screen>(startAtLogin ? "login" : "email");
  const [ownership, setOwnership] = useState<"Individual" | "Joint" | "">("");
  const [jointOwners, setJointOwners] = useState([{ firstName: "", lastName: "", email: "" }]);
  const [street, setStreet] = useState(initialAddress.street);
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState(initialAddress.city);
  const [state, setState] = useState(initialAddress.state);
  const [zip, setZip] = useState(initialAddress.zip);
  const [sameMailing, setSameMailing] = useState(true);
  const [ssn, setSsn] = useState("");
  const [pep, setPep] = useState<Answer>("no");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idState, setIdState] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");
  const [employer, setEmployer] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [purpose, setPurpose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [expectedDeposit, setExpectedDeposit] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({
    movement: "yes",
    cashIn: "no",
    cashOut: "no",
    ach: "no",
    wire: "no",
  });
  const [funding, setFunding] = useState<Funding>("");
  const [sourceAccount, setSourceAccount] = useState("");
  const [routing, setRouting] = useState("");
  const [externalAccount, setExternalAccount] = useState("");
  const [amount, setAmount] = useState(initialAmount == null ? "" : money(initialAmount));
  const [accepted, setAccepted] = useState<string[]>([]);
  const [activeDisclosure, setActiveDisclosure] = useState<string | null>(null);
  const [electronicConsent, setElectronicConsent] = useState(false);
  const [agreementConsent, setAgreementConsent] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState<OwnerDraft | null>(null);
  const [callSnapshot] = useState(() => ({
    productId: opening.fields.productId.source === "conversation" ? opening.fields.productId.value : "",
    transferAmount: opening.fields.transferAmount.source === "conversation" ? opening.fields.transferAmount.value : "",
    fullName: opening.relationship === "new" ? opening.fields.fullName.value.trim() : "",
    email: opening.relationship === "new" ? opening.fields.email.value.trim() : "",
    phone: opening.relationship === "new" ? opening.fields.phone.value.trim() : "",
    birthDate: opening.relationship === "new" ? opening.fields.birthDate.value.trim() : "",
    address: opening.relationship === "new" ? opening.fields.address.value.trim() : "",
  }));

  const product = productById(opening.fields.productId.value);
  const disclosures = disclosuresFor(opening.fields.productId.value);
  const agreedAmount = parseMoney(opening.fields.transferAmount.value);
  const existing = opening.relationship === "existing" && Boolean(opening.fields.accountNumber.value);
  const firstName = opening.fields.fullName.value.split(" ")[0] || "Customer";
  const name = opening.fields.fullName.value || "Customer";
  const amountValue = parseMoney(amount);
  const shownAddress = formatAddress(street, unit, city, state, zip);
  const fromCall = {
    name: matchesCall(callSnapshot.fullName, opening.fields.fullName.value),
    product: matchesCall(callSnapshot.productId, opening.fields.productId.value),
    phone: matchesCall(callSnapshot.phone, opening.fields.phone.value),
    email: matchesCall(callSnapshot.email, opening.fields.email.value),
    birthDate: matchesCall(callSnapshot.birthDate, opening.fields.birthDate.value),
    address: matchesCall(callSnapshot.address, shownAddress),
    amount: Boolean(callSnapshot.transferAmount) && sameMoney(callSnapshot.transferAmount, amount),
  };
  function openApplication() {
    markOpeningReviewing(id);
    go("review");
  }

  function go(next: Screen) {
    setNavOpen(false);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmDeposit() {
    if (amountValue == null || !fundingReady(funding, existing, sourceAccount, routing, externalAccount)) return;
    updateOpeningField(id, "transferAmount", String(amountValue));
    go("submitting");
    window.setTimeout(() => go("review"), 1400);
  }

  function beginBankDetails() {
    go("bank-details-loading");
    window.setTimeout(() => go("initial-deposit"), 1500);
  }

  function beginOwnerEdit() {
    const parts = splitName(opening.fields.fullName.value);
    setOwnerDraft({
      ...parts,
      productId: opening.fields.productId.value,
      phone: opening.fields.phone.value,
      email: opening.fields.email.value,
      birthDate: opening.fields.birthDate.value,
      street,
      unit,
      city,
      state,
      zip,
      ssn,
      idType,
      idNumber,
      idState,
      issueDate,
      expirationDate,
      uploadedFile,
      employer,
      occupation,
    });
  }

  function saveOwnerEdit() {
    if (!ownerDraft) return;
    const fullName = [ownerDraft.first, ownerDraft.middle, ownerDraft.last, ownerDraft.suffix].filter(Boolean).join(" ");
    updateOpeningField(id, "fullName", fullName);
    updateOpeningField(id, "phone", ownerDraft.phone);
    updateOpeningField(id, "email", ownerDraft.email);
    updateOpeningField(id, "birthDate", ownerDraft.birthDate);
    updateOpeningField(id, "address", formatAddress(ownerDraft.street, ownerDraft.unit, ownerDraft.city, ownerDraft.state, ownerDraft.zip));
    updateOpeningField(id, "productId", ownerDraft.productId);
    setStreet(ownerDraft.street);
    setUnit(ownerDraft.unit);
    setCity(ownerDraft.city);
    setState(ownerDraft.state);
    setZip(ownerDraft.zip);
    setSsn(ownerDraft.ssn);
    setIdType(ownerDraft.idType);
    setIdNumber(ownerDraft.idNumber);
    setIdState(ownerDraft.idState);
    setIssueDate(ownerDraft.issueDate);
    setExpirationDate(ownerDraft.expirationDate);
    setUploadedFile(ownerDraft.uploadedFile);
    setEmployer(ownerDraft.employer);
    setOccupation(ownerDraft.occupation);
    setOwnerDraft(null);
  }

  function submitApplication() {
    if (
      !electronicConsent ||
      !agreementConsent ||
      !disclosures.every((item) => accepted.includes(item.id))
    ) {
      return;
    }
    go("submitted-loading");
    signOpening(id);
    window.setTimeout(() => go("submitted"), 900);
  }

  if (screen === "email") {
    return (
      <EmailPreview
        name={name}
        email={opening.fields.email.value}
        product={product?.name || "new account"}
        amount={agreedAmount}
        applyHref={`/account-opening/customer/${opening.id}?apply=1`}
      />
    );
  }

  if (screen === "login") {
    return (
      <div className={loginPage.page}>
        <LoginFlow showBadge={false} onAuthenticated={openApplication} />
        <FooterDisclaimer />
      </div>
    );
  }

  if (screen === "submitted-loading") {
    return (
      <StandaloneLayout name={name}>
        <div className="customer-skeleton">
          <div className="customer-skeleton-circle customer-shimmer" />
          <div className="customer-skeleton-title customer-shimmer" />
          <div className="customer-skeleton-line customer-shimmer" />
          <div className="customer-skeleton-line customer-skeleton-line-short customer-shimmer" />
        </div>
      </StandaloneLayout>
    );
  }

  if (screen === "submitted") {
    const openedAmount = parseMoney(opening.fields.transferAmount.value);
    return (
      <StandaloneLayout name={name} complete>
        <div className="customer-submitted">
          <OpenAccountMark />
          <h1>Your account is now open</h1>
          <p>
            Your new <strong>{product?.name || "account"}</strong> account has been opened.
          </p>
          <div className="customer-review-card customer-submitted-card">
            <ReviewRow label="Account number" value={opening.newAccountNumber || "Opening…"} />
            <ReviewRow label="Product" value={product?.name || "—"} />
            <ReviewRow label="Initial deposit" value={openedAmount == null ? "—" : money(openedAmount)} />
          </div>
          <button type="button" className="customer-btn customer-btn-primary customer-btn-large customer-submitted-action" onClick={() => completeOpening(id)}>
            Go to Application Overview
          </button>
        </div>
      </StandaloneLayout>
    );
  }

  const meta = SCREEN_META[screen];

  return (
    <div className="customer-application">
      <CustomerHeader name={name} progress={(meta.step / 14) * 100} />
      <main className="customer-page-content">
        {screen !== "ownership-loading" && screen !== "bank-details-loading" ? (
          <SectionNav
            current={meta.section}
            open={navOpen}
            onToggle={() => setNavOpen((current) => !current)}
            onSelect={(section) => {
              const target: Record<number, Screen> = {
                1: "ownership",
                2: "address",
                3: "questionnaire",
                4: "initial-deposit",
                5: "review",
              };
              go(target[section]);
            }}
          />
        ) : null}

        {screen === "ownership-loading" ? <ApplicationStepSkeleton variant="ownership" /> : null}

        {screen === "bank-details-loading" ? <ApplicationStepSkeleton variant="bank" /> : null}

        {screen === "ownership" ? (
          <section className="customer-screen customer-ownership-page">
            <PageHeading
              title={`Welcome, ${firstName}! Please select your account ownership.`}
              subtitle="All bank products must be assigned an ownership type."
            />
            <div className="customer-ownership-card">
              <div className="customer-ownership-info">
                <div>
                  <h3>{product?.name || "Deposit account"}</h3>
                  <p>
                    {product?.kind === "cd"
                      ? `${product.termMonths} months at ${percent(product.apy)} APY`
                      : "Earn cash back on everyday purchases."}
                  </p>
                </div>
                <ul>
                  <li>Monthly compounded interest on your savings</li>
                  <li>Unlimited deposits</li>
                  <li>Secure online and mobile banking access</li>
                </ul>
              </div>
              <div className="customer-ownership-options">
                <OwnershipButton
                  icon="person"
                  selected={ownership === "Individual"}
                  label="Individual"
                  onClick={() => setOwnership("Individual")}
                />
                <OwnershipButton
                  icon="people"
                  selected={ownership === "Joint"}
                  label="Joint"
                  onClick={() => setOwnership("Joint")}
                />
              </div>
            </div>
            <Actions
              backLabel="Back to email"
              onBack={() => go("email")}
              nextLabel={ownership === "Joint" ? "Next" : "Continue"}
              onNext={() => go(ownership === "Joint" ? "joint-owner-details" : "address")}
              disabled={!ownership}
            />
          </section>
        ) : null}

        {screen === "joint-owner-details" ? (
          <section className="customer-screen">
            <PageHeading title="Who are you creating a joint account with?" />
            <div className="customer-form">
              {jointOwners.map((owner, index) => (
                <div className="customer-joint-owner-block" key={index}>
                  <AppInput label="Joint Account" value={product?.name || "Deposit account"} readOnly />
                  <div className="customer-form-row">
                    <AppInput
                      label="First Name"
                      value={owner.firstName}
                      onChange={(value) =>
                        setJointOwners((current) =>
                          current.map((item, ownerIndex) =>
                            ownerIndex === index ? { ...item, firstName: value } : item,
                          ),
                        )
                      }
                    />
                    <AppInput
                      label="Last Name"
                      value={owner.lastName}
                      onChange={(value) =>
                        setJointOwners((current) =>
                          current.map((item, ownerIndex) =>
                            ownerIndex === index ? { ...item, lastName: value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <AppInput
                    label="Email Address"
                    value={owner.email}
                    type="email"
                    onChange={(value) =>
                      setJointOwners((current) =>
                        current.map((item, ownerIndex) =>
                          ownerIndex === index ? { ...item, email: value } : item,
                        ),
                      )
                    }
                  />
                  {jointOwners.length > 1 ? (
                    <button
                      type="button"
                      className="customer-btn customer-btn-link customer-joint-owner-action"
                      onClick={() => setJointOwners((current) => current.filter((_, ownerIndex) => ownerIndex !== index))}
                    >
                      Remove joint owner
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className="customer-btn customer-btn-link customer-joint-owner-action"
                onClick={() =>
                  setJointOwners((current) => [...current, { firstName: "", lastName: "", email: "" }])
                }
              >
                + Add another joint owner
              </button>
            </div>
            <Actions
              onBack={() => go("ownership")}
              onNext={() => go("joint-owner-confirm")}
              nextLabel="Next"
              disabled={!jointOwners.every(validJointOwner)}
            />
          </section>
        ) : null}

        {screen === "joint-owner-confirm" ? (
          <section className="customer-screen customer-joint-confirm">
            <PageHeading
              title="An email will be sent to the joint owner of this account"
              subtitle="Please note that the invitation for a joint owner to be added to the account will only be issued after the primary account holder's application has been fully approved."
            />
            <div className="customer-joint-email-mark">✉</div>
            {jointOwners.map((owner, index) => (
              <div className="customer-review-card customer-joint-summary" key={index}>
                <ReviewRow label="Name" value={`${owner.firstName} ${owner.lastName}`} />
                <ReviewRow label="Email Address" value={owner.email} />
                <ReviewRow label="Joint Account" value={product?.name || "Deposit account"} />
              </div>
            ))}
            <Actions
              onBack={() => go("joint-owner-details")}
              onNext={() => go("address")}
              nextLabel="Continue"
            />
          </section>
        ) : null}

        {screen === "address" ? (
          <section className="customer-screen">
            <PageHeading
              title="What's your primary address?"
              subtitle="This is your residential address, typically on your driver's license or government-issued ID."
            />
            <div className="customer-form">
              <AppInput label="Primary Street Address" value={street} onChange={setStreet} />
              <AppInput label="Unit (Optional)" value={unit} onChange={setUnit} />
              <AppInput label="Zip Code" value={zip} onChange={setZip} />
              <div className="customer-form-row">
                <AppSelect label="State" value={state} onChange={setState} options={STATES} />
                <AppInput label="City" value={city} onChange={setCity} />
              </div>
              <label className="customer-checkbox">
                <input type="checkbox" checked={sameMailing} onChange={(event) => setSameMailing(event.target.checked)} />
                <span>This is also my mailing address</span>
              </label>
            </div>
            <Actions
              onBack={() => go(ownership === "Joint" ? "joint-owner-confirm" : "ownership")}
              onNext={() => go("identity")}
              disabled={!street || !city || !state || !zip}
            />
          </section>
        ) : null}

        {screen === "identity" ? (
          <section className="customer-screen">
            <PageHeading title="Let's verify your identity" />
            <div className="customer-form">
              <AppInput label="Date of Birth" value={opening.fields.birthDate.value} readOnly />
              <AppInput
                label="Social Security Number"
                value={ssn}
                type="password"
                onChange={(value) => setSsn(formatSsn(value))}
              />
              <p className="customer-security-note">
                <ShieldIcon /> We use bank-level TLS 1.2 encryption to keep your data safe.
              </p>
              <RadioCards label="Are you politically exposed?" value={pep} onChange={setPep} />
            </div>
            <Actions
              onBack={() => go("address")}
              onNext={() => go("id-upload")}
              disabled={ssn.replace(/\D/g, "").length !== 9 || !pep}
            />
          </section>
        ) : null}

        {screen === "id-upload" ? (
          <section className="customer-screen">
            <PageHeading
              title="Government-issued photo ID"
              subtitle="Make sure your ID has your photo, legal name, and date of birth."
            />
            <div className="customer-form">
              <div className="customer-form-row">
                <AppSelect
                  label="ID Type"
                  value={idType}
                  onChange={setIdType}
                  options={["Driver's License", "Passport", "State ID"]}
                />
                <AppInput label="ID number" value={idNumber} onChange={setIdNumber} />
              </div>
              <div className="customer-form-row customer-form-row-three">
                <AppSelect label="Issuing State" value={idState} onChange={setIdState} options={STATES} />
                <AppInput label="Issue Date" value={issueDate} onChange={setIssueDate} />
                <AppInput label="Expiration Date" value={expirationDate} onChange={setExpirationDate} />
              </div>
              <div className="customer-upload">
                {uploadedFile ? (
                  <div className="customer-upload-file">
                    <DocumentIcon />
                    <div>
                      <strong>{uploadedFile}</strong>
                      <span>842 KB of 842 KB · Completed</span>
                    </div>
                    <button type="button" aria-label="Remove file" onClick={() => setUploadedFile("")}>
                      ×
                    </button>
                    <div className="customer-upload-progress" />
                  </div>
                ) : (
                  <>
                    <UploadIcon />
                    <strong>Choose a file or drag & drop it here</strong>
                    <span>JPEG, PNG, and PDF formats up to 10MB</span>
                    <button type="button" className="customer-btn customer-btn-secondary" onClick={() => setUploadedFile("drivers-license.pdf")}>
                      Browse files
                    </button>
                  </>
                )}
              </div>
            </div>
            <Actions
              onBack={() => go("identity")}
              onNext={() => go("jobs")}
              disabled={!idType || !idNumber || !idState || !issueDate || !expirationDate || !uploadedFile}
            />
          </section>
        ) : null}

        {screen === "jobs" ? (
          <section className="customer-screen">
            <PageHeading
              title="Tell us about your job"
              subtitle="We're required to collect your employment details. This won't affect your application."
            />
            <div className="customer-form">
              <AppInput label="Employer" value={employer} onChange={setEmployer} />
              <AppInput label="Occupation" value={occupation} onChange={setOccupation} />
            </div>
            <Actions
              onBack={() => go("id-upload")}
              onNext={() => go("phone")}
              disabled={!employer || !occupation}
            />
          </section>
        ) : null}

        {screen === "phone" ? (
          <section className="customer-screen">
            <PageHeading
              title="What's your phone number"
              subtitle="We'll text you a six-digit security code so we can verify that it's you"
            />
            <div className="customer-form">
              <AppInput label="Phone Number" value={opening.fields.phone.value} readOnly />
            </div>
            <Actions onBack={() => go("jobs")} onNext={() => go("phone-code")} />
          </section>
        ) : null}

        {screen === "phone-code" ? (
          <section className="customer-screen">
            <PageHeading
              title="Enter your verification code"
              subtitle={`A text message with a verification code was sent to ${opening.fields.phone.value}.`}
            />
            <div className="customer-form customer-code-form">
              <AppInput label="Verification Code" value={phoneCode} onChange={(value) => setPhoneCode(value.replace(/\D/g, "").slice(0, 6))} />
              <p>Didn&apos;t receive it? <button type="button">Resend Code</button></p>
              <p>Entered the wrong number? <button type="button" onClick={() => go("phone")}>Re-Enter Phone Number</button></p>
            </div>
            <Actions
              onBack={() => go("phone")}
              onNext={() => go("questionnaire")}
              nextLabel="Continue"
              disabled={phoneCode.length !== 6}
            />
          </section>
        ) : null}

        {screen === "questionnaire" ? (
          <section className="customer-screen">
            <PageHeading
              title="Account Security"
              subtitle="In order to process this application, the information below is required. Please fill in the information below regarding your expectations on how money will move through this account."
            />
            <div className="customer-form">
              <AppSelect
                label="Purpose of Account"
                value={purpose}
                onChange={setPurpose}
                options={["Personal", "Business", "Savings", "Investment"]}
              />
              <AppSelect
                label="Expected Deposit Frequency"
                value={frequency}
                onChange={setFrequency}
                options={["Weekly", "Bi-weekly", "Monthly", "Quarterly"]}
              />
              <AppSelect
                label="Expected Deposit"
                value={expectedDeposit}
                onChange={setExpectedDeposit}
                options={["Employment Income", "Savings", "Investment Income", "Other"]}
              />
              <RadioCards
                label="Do you expect to deposit and/or withdraw from this account?"
                value={answers.movement}
                onChange={(value) => setAnswers((current) => ({ ...current, movement: value }))}
              />
              <RadioCards
                label="Expects Cash Deposits"
                value={answers.cashIn}
                onChange={(value) => setAnswers((current) => ({ ...current, cashIn: value }))}
              />
              {answers.cashIn === "yes" ? (
                <AppSelect
                  label="Monthly Cash Deposit Volume"
                  value={answers.cashInAmount || ""}
                  onChange={(value) => setAnswers((current) => ({ ...current, cashInAmount: value as Answer }))}
                  options={["$0 - $1,000", "$1,001 - $3,000", "$3,001 - $5,000", "$5,001 - $10,000", "$10,001+"]}
                />
              ) : null}
              <RadioCards
                label="Expects Cash Withdrawals"
                value={answers.cashOut}
                onChange={(value) => setAnswers((current) => ({ ...current, cashOut: value }))}
              />
              <RadioCards
                label="Do you expect to deposit and/or withdraw money from this account via ACH Transfer?"
                value={answers.ach}
                onChange={(value) => setAnswers((current) => ({ ...current, ach: value }))}
              />
              <RadioCards
                label="Do you expect to deposit and/or withdraw money from this account via wire transfers?"
                value={answers.wire}
                onChange={(value) => setAnswers((current) => ({ ...current, wire: value }))}
              />
            </div>
            <Actions
              onBack={() => go("phone-code")}
              onNext={beginBankDetails}
              nextLabel="Continue"
              disabled={!purpose || !frequency || !expectedDeposit}
            />
          </section>
        ) : null}

        {screen === "initial-deposit" ? (
          <section className="customer-screen">
            <PageHeading
              title="Set up your initial deposit"
              subtitle="To open your new account, you will need to deposit funds into the account. All new account funding is held for five calendar days."
            />
            <div className="customer-deposit-options">
              <DepositOption
                selected={funding === "plaid"}
                icon="bank"
                title="Link a bank"
                badge="Recommended"
                detail="Sync your bank with Plaid and add up to $250,000 instantly."
                onClick={() => setFunding("plaid")}
              />
              <DepositOption
                selected={funding === "manual"}
                icon="manual"
                title="Enter account information"
                detail="Manually add your bank's Account and Routing information. Add up to $1,000."
                onClick={() => setFunding("manual")}
              />
              {existing ? (
                <DepositOption
                  selected={funding === "internal"}
                  icon="seb"
                  title="Transfer from your SouthEast Bank account"
                  detail="Transfer funds from your existing SouthEast Bank account. Transfer up to $250,000."
                  onClick={() => setFunding("internal")}
                />
              ) : null}
            </div>
            <Actions
              onBack={() => go("questionnaire")}
              onNext={() => go("deposit-amount")}
              disabled={!funding}
            />
          </section>
        ) : null}

        {screen === "deposit-amount" ? (
          <section className="customer-screen">
            <PageHeading
              title="How much do you want to deposit?"
              subtitle="Please note your account deposits will not be processed until account gets approved."
            />
            <div className="customer-deposit-card">
              <label>From</label>
              {funding === "internal" ? (
                <AppSelect
                  label="Select SouthEast Bank account"
                  value={sourceAccount}
                  onChange={setSourceAccount}
                  options={[
                    opening.fields.existingAccount.value || "SEB Checking **4892",
                    "SEB Savings **3317",
                  ]}
                />
              ) : funding === "plaid" ? (
                <AppSelect
                  label="Select source account"
                  value={sourceAccount}
                  onChange={setSourceAccount}
                  options={["Chase Bank **4487", "Bank of America **1234", "Wells Fargo **5678"]}
                />
              ) : (
                <div className="customer-form">
                  <AppInput label="Routing Number" value={routing} onChange={setRouting} />
                  <AppInput label="Account Number" value={externalAccount} onChange={setExternalAccount} />
                </div>
              )}
              <label>To</label>
              <div className="customer-static-account">
                <SebMark />
                <span>{product?.name || "Deposit account"}</span>
              </div>
              <label>Amount</label>
              <div className="customer-amount-input">
                <span>$</span>
                <input
                  aria-label="Amount"
                  value={amount.replace("$", "")}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <p>{product?.name || "Account"} deposits require between $1,000 - $250,000</p>
            </div>
            <button type="button" className="customer-change-method" onClick={() => go("initial-deposit")}>
              Use a different transfer method
            </button>
            <Actions
              onBack={() => go("initial-deposit")}
              onNext={confirmDeposit}
              nextLabel="Confirm initial deposit"
              disabled={amountValue == null || !fundingReady(funding, existing, sourceAccount, routing, externalAccount)}
            />
          </section>
        ) : null}

        {screen === "submitting" ? (
          <section className="customer-submitting">
            <h1>Organizing your account details</h1>
            <p>This can take up to 30 seconds. Please stay on this screen.</p>
            <div>
              <span />
              <span />
            </div>
          </section>
        ) : null}

        {screen === "review" ? (
          <section className="customer-screen customer-review-page">
            <PageHeading
              title="Does everything look good?"
              subtitle="Please note your account deposits will not be processed until account gets approved."
            />
            <ReviewSection
              title="Primary Owner"
              action={ownerDraft ? undefined : "Edit"}
              onAction={beginOwnerEdit}
              actions={
                ownerDraft ? (
                  <div className="customer-review-edit-actions">
                    <button type="button" className="customer-btn customer-btn-secondary" onClick={() => setOwnerDraft(null)}>
                      Cancel
                    </button>
                    <button type="button" className="customer-btn customer-btn-primary" onClick={saveOwnerEdit}>
                      Save Changes
                    </button>
                  </div>
                ) : null
              }
            >
              {ownerDraft ? (
                <OwnerEditor
                  draft={ownerDraft}
                  fromCall={{
                    name: matchesCall(callSnapshot.fullName, [ownerDraft.first, ownerDraft.middle, ownerDraft.last, ownerDraft.suffix].filter(Boolean).join(" ")),
                    product: matchesCall(callSnapshot.productId, ownerDraft.productId),
                    phone: matchesCall(callSnapshot.phone, ownerDraft.phone),
                    email: matchesCall(callSnapshot.email, ownerDraft.email),
                    birthDate: matchesCall(callSnapshot.birthDate, ownerDraft.birthDate),
                    address: matchesCall(
                      callSnapshot.address,
                      formatAddress(ownerDraft.street, ownerDraft.unit, ownerDraft.city, ownerDraft.state, ownerDraft.zip),
                    ),
                  }}
                  onChange={(partial) => setOwnerDraft((current) => (current ? { ...current, ...partial } : current))}
                />
              ) : (
                <>
                  <ReviewRow label="Name" value={name} fromCall={fromCall.name} />
                  <ReviewRow label="Account Type" value={product?.name || "—"} fromCall={fromCall.product} />
                  <ReviewRow label="Phone Number" value={opening.fields.phone.value} fromCall={fromCall.phone} />
                  <ReviewRow label="Email Address" value={opening.fields.email.value} fromCall={fromCall.email} />
                  <ReviewRow label="Date of Birth" value={opening.fields.birthDate.value} fromCall={fromCall.birthDate} />
                  <ReviewRow
                    label="Primary Address"
                    value={[street, unit, `${city}, ${state} ${zip}`.trim()].filter(Boolean).join("\n")}
                    fromCall={fromCall.address}
                  />
                  <ReviewRow label="Social Security" value={ssn ? `*** - ** - ${ssn.slice(-4)}` : ""} />
                  <ReviewRow
                    label="Government ID"
                    value={
                      idType
                        ? `${idType}: #${idNumber}\nIssued: ${issueDate}\nExpires: ${expirationDate}${uploadedFile ? `\n${uploadedFile}` : ""}`
                        : ""
                    }
                  />
                  <ReviewRow label="Job Status" value={occupation || employer ? `${occupation} at ${employer}` : ""} />
                </>
              )}
            </ReviewSection>
            {ownership === "Joint" ? (
              <ReviewSection title="Joint Owner(s)">
                {jointOwners.map((owner, index) => (
                  <ReviewRow
                    key={index}
                    label={`${owner.firstName} ${owner.lastName}`}
                    value={`${owner.email}\nInvitation pending`}
                  />
                ))}
              </ReviewSection>
            ) : null}
            <ReviewSection title="Initial Deposit Requests" action="Change Funding Information" onAction={() => go("initial-deposit")}>
              <ReviewRow label="Funding Amount" value={amountValue == null ? "—" : money(amountValue)} fromCall={fromCall.amount} />
              <ReviewRow
                label="Funding Source"
                value={
                  funding === "manual"
                    ? `Account ${externalAccount}`
                    : sourceAccount || opening.fields.existingAccount.value || "—"
                }
              />
            </ReviewSection>
            <div className="customer-review-section">
              <h2>Legal Agreements</h2>
              <div className="customer-review-card customer-legal-card">
                <p>
                  Finish your application by carefully reviewing the following legal information. Please open documents
                  in a new tab to print or save for your records. By clicking Agree &amp; Submit you are attesting that
                  you have read and agree to each agreement.
                </p>
                <div className="customer-disclosure-links">
                  {disclosures.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={accepted.includes(item.id) ? "accepted" : ""}
                      onClick={() => setActiveDisclosure(item.id)}
                    >
                      <i>{accepted.includes(item.id) ? "✓" : ""}</i>
                      {item.title}
                    </button>
                  ))}
                </div>
                <div>
                  <p>I also certify under the penalty of perjury that:</p>
                  <ul>
                    <li>I can confirm that I am a U.S. Citizen or Resident Alien, that the information I provide in this application is correct, and that I am not subject to backup withholding by the IRS.</li>
                    <li>Consumer ACH Authorization and Agreement: As an authorized signer on the financial institution account identified below, I authorize SouthEast Bank to perform a single EFT withdrawal from my account for the initial funding into my SouthEast Bank account. I understand the funds will be deposited into the account(s) I have specified. I understand and agree that if the EFT withdrawal from my account is returned unpaid for any reason, SouthEast Bank may charge my account a fee.</li>
                    <li>By submitting your application, you agree to the Account Terms and Conditions and Disclosures.</li>
                    <li>I have read and agree to the site terms and disclosures.</li>
                  </ul>
                </div>
                <Consent box checked={electronicConsent} onClick={() => setElectronicConsent((current) => !current)}>
                  I consent to the electronic delivery of the Account Agreements and Disclosures. I confirm that I am able to access the information in an electronic form.
                </Consent>
                <Consent box checked={agreementConsent} onClick={() => setAgreementConsent((current) => !current)}>
                  I have read and agree to the statements, agreements, and disclosures above.
                </Consent>
              </div>
            </div>
            <div className="customer-submit">
              <button
                type="button"
                className="customer-btn customer-btn-primary customer-btn-large"
                disabled={
                  !electronicConsent ||
                  !agreementConsent ||
                  !disclosures.every((item) => accepted.includes(item.id))
                }
                onClick={submitApplication}
              >
                Submit Application
              </button>
            </div>
          </section>
        ) : null}
      </main>
      <CustomerFooter />

      {activeDisclosure ? (
        <DisclosureModal
          title={disclosures.find((item) => item.id === activeDisclosure)?.title || "Disclosure"}
          onClose={() => setActiveDisclosure(null)}
          onAccept={() => {
            setAccepted((current) => (current.includes(activeDisclosure) ? current : [...current, activeDisclosure]));
            setActiveDisclosure(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ApplicationStepSkeleton({ variant }: { variant: "ownership" | "bank" }) {
  return (
    <div className={`customer-step-skeleton customer-step-skeleton-${variant}`}>
      <div className="customer-step-skeleton-badge customer-shimmer" />
      <div className="customer-step-skeleton-title customer-shimmer" />
      <div className="customer-step-skeleton-line customer-shimmer" />
      {variant === "bank" ? (
        <>
          <div className="customer-step-skeleton-line customer-step-skeleton-line-medium customer-shimmer" />
          <div className="customer-step-skeleton-line customer-step-skeleton-line-short customer-shimmer" />
          <div className="customer-step-skeleton-card customer-step-skeleton-card-tall customer-shimmer" />
          <div className="customer-step-skeleton-card customer-shimmer" />
          <div className="customer-step-skeleton-card customer-shimmer" />
        </>
      ) : (
        <>
          <div className="customer-step-skeleton-card customer-step-skeleton-card-ownership customer-shimmer" />
          <div className="customer-step-skeleton-actions">
            <div className="customer-step-skeleton-back customer-shimmer" />
            <div className="customer-step-skeleton-next customer-shimmer" />
          </div>
        </>
      )}
    </div>
  );
}

function EmailPreview({
  name,
  email,
  product,
  amount,
  applyHref,
}: {
  name: string;
  email: string;
  product: string;
  amount: number | null;
  applyHref: string;
}) {
  return (
    <div className={`customer-gmail ${gmailFont.className}`}>
      <header className="customer-gmail-top">
        <button type="button" aria-label="Main menu"><MailIcon name="menu" /></button>
        <div className="customer-gmail-logo">
          <Image src="/brand/gmail-logo.png" alt="Gmail" width={109} height={40} priority />
        </div>
        <div className="customer-gmail-search"><MailIcon name="search" /> Search mail</div>
        <div className="customer-gmail-tools">
          <button type="button" aria-label="Support"><MailIcon name="help" /></button>
          <button type="button" aria-label="Settings"><MailIcon name="settings" /></button>
          <button type="button" aria-label="Google apps"><MailIcon name="apps" /></button>
          <span title={email}>{name.split(" ")[0]?.[0] || "C"}</span>
        </div>
      </header>
      <div className="customer-gmail-layout">
        <aside>
          <button type="button" className="customer-gmail-compose"><MailIcon name="compose" /> Compose</button>
          <nav>
            <strong><MailIcon name="inbox" /> Inbox <em>1</em></strong>
            <span><MailIcon name="star" /> Starred</span>
            <span><MailIcon name="snooze" /> Snoozed</span>
            <span><MailIcon name="send" /> Sent</span>
            <span><MailIcon name="draft" /> Drafts <em>1</em></span>
            <span><MailIcon name="spam" /> Spam <em>3</em></span>
            <span><MailIcon name="trash" /> Trash</span>
          </nav>
        </aside>
        <main>
          <div className="customer-gmail-toolbar">
            <div className="customer-gmail-toolbar-actions">
              <button type="button" aria-label="Back to inbox"><MailIcon name="back" /></button>
              <i />
              <button type="button" aria-label="Archive"><MailIcon name="archive" /></button>
              <button type="button" aria-label="Report spam"><MailIcon name="spam" /></button>
              <button type="button" aria-label="Delete"><MailIcon name="trash" /></button>
              <i />
              <button type="button" aria-label="Mark as unread"><MailIcon name="unread" /></button>
              <button type="button" aria-label="Snooze"><MailIcon name="snooze" /></button>
              <button type="button" aria-label="Add to tasks"><MailIcon name="tasks" /></button>
              <button type="button" aria-label="Move to"><MailIcon name="move" /></button>
              <button type="button" aria-label="Labels"><MailIcon name="label" /></button>
              <button type="button" aria-label="More"><MailIcon name="more" /></button>
            </div>
            <div className="customer-gmail-pagination">
              <span>1–1 of 1</span>
              <button type="button" aria-label="Newer"><MailIcon name="back" /></button>
              <button type="button" aria-label="Older"><MailIcon name="forward" /></button>
            </div>
          </div>
          <article className="customer-gmail-message">
            <div className="customer-gmail-subject">
              <h1>Your SouthEast Bank application is ready <span>Inbox <i>×</i></span></h1>
              <div>
                <button type="button" aria-label="Print"><MailIcon name="print" /></button>
                <button type="button" aria-label="Open in new window"><MailIcon name="open" /></button>
              </div>
            </div>
            <div className="customer-gmail-sender">
              <span className="customer-gmail-avatar">
                <Image src="/brand/seb-avatar.png" alt="SouthEast Bank" width={40} height={40} />
              </span>
              <div>
                <p><strong>SouthEast Bank</strong> <span>&lt;applications@southeastbank.com&gt;</span></p>
                <small>to {email}</small>
              </div>
              <time>9:14 AM</time>
              <button type="button" aria-label="Star"><MailIcon name="star" /></button>
              <button type="button" aria-label="Reply"><MailIcon name="reply" /></button>
              <button type="button" aria-label="More"><MailIcon name="more" /></button>
            </div>
            <div className="customer-gmail-letter">
              <p>Hi {name},</p>
              <p>
                Thank you for speaking with Kate. We prepared your {product} application using the information you
                confirmed on the call.
              </p>
              <div className="customer-gmail-summary">
                <span>Product</span>
                <strong>{product}</strong>
                <span>Amount to open</span>
                <strong>{amount == null ? "Confirm in application" : money(amount)}</strong>
              </div>
              <p>Review the application, complete the remaining details, confirm the amount, and sign your disclosures.</p>
              <a className="customer-gmail-cta" href={applyHref} target="_blank" rel="noopener noreferrer">
                Review and submit application
              </a>
              <p className="customer-gmail-signature">SouthEast Bank<br />Customer Care</p>
            </div>
            <div className="customer-gmail-replies">
              <button type="button"><MailIcon name="reply" /> Reply</button>
              <button type="button"><MailIcon name="forward" /> Forward</button>
            </div>
          </article>
        </main>
        <div className="customer-gmail-rail">
          <button type="button" className="customer-gmail-rail-calendar" aria-label="Calendar"><MailIcon name="calendar" /></button>
          <button type="button" className="customer-gmail-rail-keep" aria-label="Keep"><MailIcon name="keep" /></button>
          <button type="button" className="customer-gmail-rail-tasks" aria-label="Tasks"><MailIcon name="tasks" /></button>
          <button type="button" className="customer-gmail-rail-contacts" aria-label="Contacts"><MailIcon name="contacts" /></button>
          <i />
          <button type="button" aria-label="Get add-ons"><MailIcon name="plus" /></button>
        </div>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg className="customer-chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M11.9393 5L7.99997 8.89995L4.06056 5L3 6.05004L7.99997 11L13 6.05004L11.9393 5Z" />
    </svg>
  );
}

function CustomerHeader({ name, progress }: { name: string; progress: number }) {
  return (
    <header className="customer-app-header">
      <Image src="/dashboard/logo.png" alt="SouthEast Bank" width={224} height={60} priority />
      <button type="button">
        {name} <ChevronDown />
      </button>
      <div className="customer-progress">
        <span style={{ width: `${progress}%` }} />
        <i style={{ left: "25%" }} />
        <i style={{ left: "50%" }} />
        <i style={{ left: "75%" }} />
      </div>
    </header>
  );
}

function SectionNav({
  current,
  open,
  onToggle,
  onSelect,
}: {
  current: number;
  open: boolean;
  onToggle: () => void;
  onSelect: (section: number) => void;
}) {
  return (
    <div className="customer-section-nav">
      <button type="button" onClick={onToggle}>
        {current} of 5 — {SECTION_LABELS[current - 1]} <ChevronDown />
      </button>
      {open ? (
        <div>
          {SECTION_LABELS.map((label, index) => (
            <button key={label} type="button" onClick={() => onSelect(index + 1)}>
              {index + 1} of 5 — {label} {current === index + 1 ? <span>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="customer-page-heading">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function AppInput({
  label,
  value,
  onChange,
  readOnly,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="customer-input">
      <input
        type={type}
        value={value}
        placeholder=" "
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <span>{label}</span>
    </label>
  );
}

function AppSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="customer-select">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{label}</option>
        {options.filter(Boolean).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span>⌄</span>
    </label>
  );
}

function Actions({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="customer-actions">
      <button type="button" className="customer-btn customer-btn-link customer-btn-large" onClick={onBack}>
        ‹ {backLabel}
      </button>
      <button type="button" className="customer-btn customer-btn-primary customer-btn-large" disabled={disabled} onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}

function OwnershipButton({
  icon,
  selected,
  label,
  onClick,
}: {
  icon: "person" | "people";
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={selected ? "selected" : ""} onClick={onClick}>
      {icon === "person" ? <PersonIcon /> : <PeopleIcon />} {label}
    </button>
  );
}

function RadioCards({ label, value, onChange }: { label: string; value: Answer; onChange: (value: Answer) => void }) {
  return (
    <div className="customer-radio-group">
      <p>{label}</p>
      <div>
        {(["yes", "no"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "selected" : ""}
            onClick={() => onChange(option)}
          >
            <i /> {option === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function DepositOption({
  selected,
  icon,
  title,
  badge,
  detail,
  onClick,
}: {
  selected: boolean;
  icon: "bank" | "manual" | "seb";
  title: string;
  badge?: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={selected ? "selected" : ""} onClick={onClick}>
      <span className={`customer-deposit-icon customer-deposit-icon-${icon}`}>
        {icon === "seb" ? <SebMark /> : icon === "bank" ? "▥" : "▤"}
      </span>
      <span className="customer-deposit-copy">
        <span><strong>{title}</strong>{badge ? <em>{badge}</em> : null}</span>
        <small>{detail}</small>
      </span>
      <b>›</b>
    </button>
  );
}

function ReviewSection({
  title,
  action,
  onAction,
  actions,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="customer-review-section">
      <div className="customer-review-section-header">
        <h2>{title}</h2>
        {actions || (action ? <button type="button" className="customer-btn customer-btn-secondary" onClick={onAction}>{action}</button> : null)}
      </div>
      <div className="customer-review-card">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, fromCall = false }: { label: string; value: string; fromCall?: boolean }) {
  return (
    <div className={`customer-review-row${fromCall ? " from-call" : ""}`}>
      <span>{label}{fromCall ? <em>From your call</em> : null}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function CallFields({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={active ? "customer-call-field" : undefined}>
      {children}
      {active ? <em>From your call</em> : null}
    </div>
  );
}

function OwnerEditor({
  draft,
  fromCall,
  onChange,
}: {
  draft: OwnerDraft;
  fromCall: { name: boolean; product: boolean; phone: boolean; email: boolean; birthDate: boolean; address: boolean };
  onChange: (partial: Partial<OwnerDraft>) => void;
}) {
  return (
    <div className="customer-form customer-owner-editor">
      <CallFields active={fromCall.name}>
        <div className="customer-form-row customer-form-row-four">
          <AppInput label="First Name" value={draft.first} onChange={(value) => onChange({ first: value })} />
          <AppInput label="Middle Initial" value={draft.middle} onChange={(value) => onChange({ middle: value })} />
          <AppInput label="Last Name" value={draft.last} onChange={(value) => onChange({ last: value })} />
          <AppInput label="Suffix" value={draft.suffix} onChange={(value) => onChange({ suffix: value })} />
        </div>
      </CallFields>
      <CallFields active={fromCall.product}>
        <AppSelect
          label="Account Type"
          value={productById(draft.productId)?.name || ""}
          onChange={(value) => onChange({ productId: PRODUCTS.find((item) => item.name === value)?.id || draft.productId })}
          options={PRODUCTS.map((item) => item.name)}
        />
      </CallFields>
      <CallFields active={fromCall.phone}>
        <AppInput label="Phone Number" value={draft.phone} onChange={(value) => onChange({ phone: value })} />
      </CallFields>
      <CallFields active={fromCall.email}>
        <AppInput label="Email Address" value={draft.email} onChange={(value) => onChange({ email: value })} />
      </CallFields>
      <CallFields active={fromCall.birthDate}>
        <AppInput label="Date of Birth" value={draft.birthDate} onChange={(value) => onChange({ birthDate: value })} />
      </CallFields>
      <CallFields active={fromCall.address}>
        <div className="customer-form">
          <AppInput label="Primary Street Address" value={draft.street} onChange={(value) => onChange({ street: value })} />
          <AppInput label="Unit (Optional)" value={draft.unit} onChange={(value) => onChange({ unit: value })} />
          <div className="customer-form-row">
            <AppInput label="City" value={draft.city} onChange={(value) => onChange({ city: value })} />
            <AppSelect label="State" value={draft.state} onChange={(value) => onChange({ state: value })} options={STATES} />
          </div>
          <AppInput label="Zip Code" value={draft.zip} onChange={(value) => onChange({ zip: value })} />
        </div>
      </CallFields>
      <AppInput label="Social Security Number" value={draft.ssn} onChange={(value) => onChange({ ssn: formatSsn(value) })} />
      <div className="customer-form-row">
        <AppSelect
          label="ID Type"
          value={draft.idType}
          onChange={(value) => onChange({ idType: value })}
          options={["Driver's License", "Passport", "State ID"]}
        />
        <AppInput label="ID Number" value={draft.idNumber} onChange={(value) => onChange({ idNumber: value })} />
      </div>
      <div className="customer-form-row customer-form-row-three">
        <AppSelect label="Issuing State" value={draft.idState} onChange={(value) => onChange({ idState: value })} options={STATES} />
        <AppInput label="Issue Date" value={draft.issueDate} onChange={(value) => onChange({ issueDate: value })} />
        <AppInput label="Expiration Date" value={draft.expirationDate} onChange={(value) => onChange({ expirationDate: value })} />
      </div>
      <div className="customer-upload customer-upload-compact">
        {draft.uploadedFile ? (
          <div className="customer-upload-file">
            <DocumentIcon />
            <div>
              <strong>{draft.uploadedFile}</strong>
              <span>Completed</span>
            </div>
            <button type="button" aria-label="Remove file" onClick={() => onChange({ uploadedFile: "" })}>×</button>
          </div>
        ) : (
          <>
            <UploadIcon />
            <strong>Choose a file or drag & drop it here</strong>
            <span>JPEG, PNG, and PDF formats up to 10MB</span>
            <button type="button" className="customer-btn customer-btn-secondary" onClick={() => onChange({ uploadedFile: "drivers-license.pdf" })}>
              Browse files
            </button>
          </>
        )}
      </div>
      <div className="customer-form-row">
        <AppInput label="Employer" value={draft.employer} onChange={(value) => onChange({ employer: value })} />
        <AppInput label="Occupation" value={draft.occupation} onChange={(value) => onChange({ occupation: value })} />
      </div>
    </div>
  );
}

function Consent({
  checked,
  onClick,
  box = false,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  box?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`customer-consent${box ? " customer-consent-box" : ""} ${checked ? "checked" : ""}`} onClick={onClick}>
      <span>{checked ? "✓" : ""}</span> {children}
    </button>
  );
}

function DisclosureModal({ title, onClose, onAccept }: { title: string; onClose: () => void; onAccept: () => void }) {
  return (
    <div className="customer-modal-backdrop" onClick={onClose}>
      <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <Image src="/dashboard/logo.png" alt="SouthEast Bank" width={224} height={60} />
          <div><strong>{title}</strong><span>Keep a copy for your records.</span></div>
        </header>
        <div className="customer-modal-body">
          <p>
            This agreement applies to the account and services you requested. Please review the terms carefully before
            accepting.
          </p>
          <h3>Electronic records and signatures</h3>
          <p>
            You may receive documents electronically instead of in paper form. Electronic signatures have the same
            legal effect as handwritten signatures.
          </p>
          <h3>Account terms</h3>
          <p>
            Your account is subject to SouthEast Bank&apos;s deposit account agreement, applicable fees, rate
            disclosures, and federal and state law.
          </p>
          <h3>Copies and withdrawal of consent</h3>
          <p>
            You may request a paper copy or withdraw electronic-delivery consent by contacting SouthEast Bank.
          </p>
        </div>
        <footer>
          <p>By clicking &quot;Accept &amp; Close&quot;, I acknowledge and accept the {title}.</p>
          <button type="button" className="customer-btn customer-btn-primary customer-btn-large" onClick={onAccept}>
            Accept &amp; Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function CustomerFooter() {
  return (
    <footer className="customer-app-footer">
      <div><a href="#">Privacy Policy</a><i /><a href="#">Contact Us</a><i /><span>Site is secured using 256-bit SSL encryption.</span></div>
      <span>2025 SouthEast Bank. All rights reserved.</span>
    </footer>
  );
}

function OpenAccountMark() {
  return (
    <div className="customer-submitted-art" aria-hidden="true">
      <span className="flag-slot flag-back">
        <img src="/brand/open-flag-blue.svg" alt="" />
      </span>
      <span className="flag-slot flag-front">
        <img src="/brand/open-flag-white.svg" alt="" />
      </span>
      <img className="check-fill" src="/brand/open-check-fill.svg" alt="" />
      <img className="check-ring" src="/brand/open-check-ring.svg" alt="" />
      <img className="check-mark" src="/brand/open-check-mark.svg" alt="" />
    </div>
  );
}

function StandaloneLayout({ name, children, complete = false }: { name: string; children: React.ReactNode; complete?: boolean }) {
  return (
    <div className={`customer-application${complete ? " customer-application-complete" : ""}`}>
      <CustomerHeader name={name} progress={100} />
      <main className="customer-page-content">{children}</main>
      <CustomerFooter />
    </div>
  );
}

function splitName(full: string) {
  const suffixes = new Set(["Jr", "Jr.", "Sr", "Sr.", "II", "III", "IV"]);
  const parts = full.trim().split(/\s+/).filter(Boolean);
  let suffix = "";
  if (parts.length > 2 && suffixes.has(parts[parts.length - 1])) suffix = parts.pop() || "";
  const first = parts.shift() || "";
  const last = parts.pop() || "";
  return { first, middle: parts.join(" "), last, suffix };
}

function formatAddress(street: string, unit: string, city: string, state: string, zip: string) {
  return [street, unit, city, `${state} ${zip}`.trim()].map((part) => part.trim()).filter(Boolean).join(", ");
}

function matchesCall(original: string, current: string) {
  return Boolean(original.trim()) && original.trim() === current.trim();
}

function sameMoney(original: string, current: string) {
  const left = parseMoney(original);
  const right = parseMoney(current);
  return left != null && right != null && left === right;
}

function parseAddress(address: string) {
  const [street = "", city = "", stateZip = ""] = address.split(",").map((part) => part.trim());
  const match = stateZip.match(/^([A-Z]{2})\s+(.+)$/);
  return { street, city, state: match?.[1] || "", zip: match?.[2] || "" };
}

function validJointOwner(owner: { firstName: string; lastName: string; email: string }) {
  return Boolean(owner.firstName.trim() && owner.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email));
}

function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function fundingReady(
  funding: Funding,
  existing: boolean,
  source: string,
  routing: string,
  account: string,
) {
  if (funding === "internal") return existing && Boolean(source);
  if (funding === "plaid") return Boolean(source);
  if (funding === "manual") return routing.replace(/\D/g, "").length === 9 && Boolean(account);
  return false;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6l7-3zM9 12l2 2 4-4" /></svg>;
}

function UploadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M12 16V4m0 0L7 9m5-5l5 5M5 14v5h14v-5" /></svg>;
}

function DocumentIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M6 2h8l4 4v16H6V2zm8 0v5h5M9 12h6M9 16h6" /></svg>;
}

function PersonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
}

function PeopleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3 20c.6-4 2.6-6 6-6s5.4 2 6 6m0-5c3 0 4.8 1.7 5.5 5" /></svg>;
}

function SebMark() {
  return <span className="customer-seb-mark"><b>S</b><i>E</i><em>B</em></span>;
}

function MailIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    back: "M14 6 8 12l6 6",
    forward: "M10 6l6 6-6 6",
    refresh: "M19 12a7 7 0 1 1-2-4.9M19 4v4h-4",
    lock: "M8 11V8a4 4 0 0 1 8 0v3M7 11h10v8H7z",
    menu: "M4 7h16M4 12h16M4 17h16",
    search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM16 16l4 4",
    help: "M12 18h.01M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.9-1.2 1.6V14",
    settings: "M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7ZM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4",
    apps: "M6 6h2v2H6zM11 6h2v2h-2zM16 6h2v2h-2zM6 11h2v2H6zM11 11h2v2h-2zM16 11h2v2h-2zM6 16h2v2H6zM11 16h2v2h-2zM16 16h2v2h-2z",
    compose: "M12 5v14M5 12h14",
    inbox: "M4 13h4l2 3h4l2-3h4v6H4zM4 13V6h16v7",
    star: "m12 4 2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 18l.9-5.1L4.8 9.3l5-.7L12 4Z",
    snooze: "M12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM12 8v5l3 2",
    send: "m5 12 14-7-4 14-3-5-7-2Z",
    draft: "M7 4h7l5 5v11H7zM14 4v5h5",
    spam: "M12 4 3 19h18L12 4ZM12 10v4M12 16h.01",
    trash: "M5 8h14M9 8V5h6v3M8 8l1 12h6l1-12",
    unread: "M4 7h16v10H4zM4 7l8 6 8-6",
    archive: "M4 8h16v3H4zM6 11v8h12v-8",
    tasks: "M5 6h2l1 2 3-4M13 7h6M5 12h2l1 2 3-4M13 13h6M5 18h2l1 2 3-4M13 19h6",
    move: "M4 6h16v13H4zM4 6l3-3h5l2 3",
    label: "M4 6h10l6 6-8 8-8-8V6ZM8 10h.01",
    calendar: "M5 5h14v14H5zM5 9h14M8 3v4M16 3v4M9 13h2M13 13h2M9 16h2M13 16h2",
    keep: "M8 4h8l2 7-6 8-6-8 2-7ZM9 19v2h6v-2",
    contacts: "M5 5h14v14H5zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 17c.7-2.4 2.3-4 5-4s4.3 1.6 5 4",
    plus: "M12 5v14M5 12h14",
    print: "M7 8V4h10v4M7 16H5V10h14v6h-2M7 14h10v6H7z",
    open: "M14 5h5v5M19 5l-8 8M10 6H5v13h13v-5",
    reply: "M9 8 4 12l5 4M4 12h9a6 6 0 0 1 6 6",
    more: "M6 12h.01M12 12h.01M18 12h.01",
  };
  return (
    <svg className="customer-gmail-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
