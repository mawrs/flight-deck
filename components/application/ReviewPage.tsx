"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { Button } from "@/components/ui/Button";
import { FloatInput } from "@/components/ui/FloatInput";
import { money } from "@/lib/format";
import { useApplication } from "@/lib/store";
import type { Application, Person } from "@/lib/types";

function dateMdY(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}

function parseMoney(value: string) {
  const next = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(next) ? next : 0;
}

function parseDate(value: string, fallback: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return fallback;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function emptyPerson(): Person {
  return {
    fullName: "",
    email: "",
    zip: "",
    state: "",
    street: "",
    city: "",
    phone: "",
    ssn: "",
    ssnLast4: "",
    citizenship: "",
    graduationYear: "",
    relationship: "",
    livingArrangement: "",
    filingStatus: "",
    birthDate: "",
    creditScore: 0,
    fico: 0,
    statedAnnualIncome: 0,
    degree: "",
    school: "",
  };
}

function addressValue(person: Person) {
  const line1 = person.street.trim();
  const line2 = [person.city, [person.state, person.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [line1, line2].filter(Boolean).join("\n");
}

function degreeValue(person: Person) {
  return [
    person.degree,
    person.school,
    person.graduationYear ? `Graduated ${person.graduationYear}` : "",
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function formatSsn(ssn: string) {
  const digits = ssn.replace(/\D/g, "").slice(0, 9);
  if (digits.length !== 9) return ssn.trim();
  return `${digits.slice(0, 3)} - ${digits.slice(3, 5)} - ${digits.slice(5)}`;
}

function maskSsn(ssn: string) {
  const last4 = ssn.replace(/\D/g, "").slice(-4);
  if (!last4) return "";
  return `*** - ** - ${last4}`;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "", middle: "", last: "" };
  if (parts.length === 2) return { first: parts[0], middle: "", last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" ").replace(/\.+$/, ""),
    last: parts[parts.length - 1],
  };
}

type EditorField = { label: string; value: string };

type FieldId =
  | "amount"
  | "name"
  | "birthDate"
  | "phone"
  | "address"
  | "livingArrangement"
  | "highestDegree"
  | "ssn"
  | "citizenship"
  | "income"
  | "employmentStatus"
  | "hasCosigner"
  | "cosignerName"
  | "cosignerEmail"
  | "cosignerRelationship";

export function ReviewPage() {
  const { id, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  if (!application) return null;
  const file = application;

  const borrower = file.borrower;
  const living =
    borrower.livingArrangement ||
    (application.income.housingPayment > 0 ? "Renting" : "Owning");
  const job = application.employment[0];
  const name = splitName(borrower.fullName);
  const cosignerName = splitName(application.cosigner?.fullName ?? "");

  const rows: {
    id: FieldId;
    label: string;
    value: string;
    masked?: string;
    fields: EditorField[];
  }[] = [
    {
      id: "amount",
      label: "Refinance Amount",
      value: money(application.amount),
      fields: [{ label: "Refinance Amount", value: money(application.amount) }],
    },
    {
      id: "name",
      label: "Name",
      value: borrower.fullName,
      fields: [
        { label: "First Name", value: name.first },
        { label: "Middle Initial (Optional)", value: name.middle },
        { label: "Last Name", value: name.last },
      ],
    },
    {
      id: "birthDate",
      label: "Date of Birth",
      value: dateMdY(borrower.birthDate),
      fields: [{ label: "Date of Birth", value: dateMdY(borrower.birthDate) }],
    },
    {
      id: "phone",
      label: "Phone Number",
      value: borrower.phone,
      fields: [{ label: "Phone Number", value: borrower.phone }],
    },
    {
      id: "address",
      label: "Permanent Address",
      value: addressValue(borrower),
      fields: [
        { label: "Street", value: borrower.street },
        { label: "City", value: borrower.city },
        { label: "State", value: borrower.state },
        { label: "ZIP", value: borrower.zip },
      ],
    },
    {
      id: "livingArrangement",
      label: "Living Arrangement",
      value: living,
      fields: [{ label: "Living Arrangement", value: living }],
    },
    {
      id: "highestDegree",
      label: "Highest Degree",
      value: degreeValue(borrower),
      fields: [
        { label: "Degree", value: borrower.degree },
        { label: "School", value: borrower.school },
        { label: "Graduation Year", value: borrower.graduationYear },
      ],
    },
    {
      id: "ssn",
      label: "Social Security Number (SSN)",
      value: formatSsn(borrower.ssn || borrower.ssnLast4),
      masked: maskSsn(borrower.ssn || borrower.ssnLast4),
      fields: [
        { label: "Social Security Number (SSN)", value: formatSsn(borrower.ssn || borrower.ssnLast4) },
      ],
    },
    {
      id: "citizenship",
      label: "Citizenship Status",
      value: borrower.citizenship,
      fields: [{ label: "Citizenship Status", value: borrower.citizenship }],
    },
    {
      id: "income",
      label: "Estimated Annual Income",
      value: money(borrower.statedAnnualIncome),
      fields: [{ label: "Estimated Annual Income", value: money(borrower.statedAnnualIncome) }],
    },
    {
      id: "employmentStatus",
      label: "Employment Status",
      value: job?.status ?? "",
      fields: [{ label: "Employment Status", value: job?.status ?? "" }],
    },
    {
      id: "hasCosigner",
      label: "Cosigner",
      value: application.cosigner ? "Yes" : "No",
      fields: [{ label: "Cosigner", value: application.cosigner ? "Yes" : "No" }],
    },
    {
      id: "cosignerName",
      label: "Cosigner Name",
      value: application.cosigner?.fullName ?? "",
      fields: [
        { label: "First Name", value: cosignerName.first },
        { label: "Middle Initial (Optional)", value: cosignerName.middle },
        { label: "Last Name", value: cosignerName.last },
      ],
    },
    {
      id: "cosignerEmail",
      label: "Cosigner Email",
      value: application.cosigner?.email ?? "",
      fields: [{ label: "Cosigner Email", value: application.cosigner?.email ?? "" }],
    },
    {
      id: "cosignerRelationship",
      label: "Cosigner Relationship",
      value: application.cosigner?.relationship ?? "",
      fields: [{ label: "Cosigner Relationship", value: application.cosigner?.relationship ?? "" }],
    },
  ];

  function save(field: FieldId, value: string) {
    updateApplication(id, patchForField(file, field, value));
  }

  return (
    <div className="bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Review Application</h1>
      </div>
      <div className="flex flex-col">
        {rows.map((row, index) => (
          <ReviewRow
            key={row.id}
            id={row.id}
            label={row.label}
            value={row.value}
            masked={row.masked}
            fields={row.fields}
            last={index === rows.length - 1}
            readOnly={readOnly}
            onSave={(next) => save(row.id, next)}
          />
        ))}
      </div>
    </div>
  );
}

function composeValue(id: FieldId, values: string[]) {
  if (id === "name" || id === "cosignerName") {
    return values.map((item) => item.trim()).filter(Boolean).join(" ");
  }
  if (id === "address") {
    const [street = "", city = "", state = "", zip = ""] = values;
    const cityLine = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    return [street.trim(), cityLine].filter(Boolean).join("\n");
  }
  if (id === "highestDegree") {
    const [degree = "", school = "", year = ""] = values;
    return [degree, school, year.trim() ? `Graduated ${year.trim()}` : ""]
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }
  return values[0] ?? "";
}

function ReviewRow({
  id,
  label,
  value,
  masked,
  fields,
  last,
  readOnly,
  onSave,
}: {
  id: FieldId;
  label: string;
  value: string;
  masked?: string;
  fields: EditorField[];
  last: boolean;
  readOnly: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [drafts, setDrafts] = useState(fields.map((field) => field.value));

  function cancel() {
    setDrafts(fields.map((field) => field.value));
    setEditing(false);
  }

  function startEditing() {
    setDrafts(fields.map((field) => field.value));
    setEditing(true);
  }

  function save() {
    setEditing(false);
    onSave(composeValue(id, drafts));
  }

  const columns =
    drafts.length >= 4 ? "grid-cols-2" : drafts.length === 3 ? "grid-cols-3" : drafts.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div
      className={`group flex items-start gap-[10px] p-lg hover:bg-gray-lightest ${
        last ? "" : "border-b border-gray-light"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <p className="text-sm text-gray-dark">{label}</p>
        <p className="whitespace-pre-line text-base font-normal text-black">
          {masked && !editing ? (
            <>
              <span className={hovered ? "hidden" : ""}>{masked}</span>
              <span className={hovered ? "" : "hidden"}>{value || "—"}</span>
            </>
          ) : (
            value || "—"
          )}
        </p>
        {editing ? (
          <div className={`mt-sm grid gap-md ${columns}`}>
            {fields.map((field, index) => (
              <FloatInput
                key={field.label}
                label={field.label}
                value={drafts[index] ?? ""}
                autoFocus={index === 0}
                onChange={(next) =>
                  setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)))
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancel();
                  }
                  if (event.key === "Enter" && drafts.length === 1) {
                    event.preventDefault();
                    save();
                  }
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
      {readOnly ? null : editing ? (
        <div className="flex shrink-0 items-center gap-sm">
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          className={hovered ? "" : "invisible"}
          onClick={startEditing}
        >
          Edit
        </Button>
      )}
    </div>
  );
}

function patchForField(application: Application, field: FieldId, value: string) {
  const borrower = application.borrower;
  const next = value.trim();

  if (field === "amount") return { amount: parseMoney(next) };
  if (field === "name") return { borrower: { ...borrower, fullName: next } };
  if (field === "birthDate") return { borrower: { ...borrower, birthDate: parseDate(next, borrower.birthDate) } };
  if (field === "phone") return { borrower: { ...borrower, phone: next } };
  if (field === "livingArrangement") return { borrower: { ...borrower, livingArrangement: next } };
  if (field === "citizenship") return { borrower: { ...borrower, citizenship: next } };
  if (field === "income") return { borrower: { ...borrower, statedAnnualIncome: parseMoney(next) } };
  if (field === "ssn") {
    const digits = next.replace(/\D/g, "").slice(0, 9);
    return { borrower: { ...borrower, ssn: formatSsn(digits) || next, ssnLast4: digits.slice(-4) } };
  }
  if (field === "address") {
    const [street = "", cityLine = ""] = value.split("\n").map((line) => line.trim());
    const cityMatch = cityLine.match(/^(.*?)(?:,\s*)?([A-Z]{2})?\s*(\d{5}(?:-\d{4})?)?$/i);
    return {
      borrower: {
        ...borrower,
        street,
        city: cityMatch?.[1]?.replace(/,$/, "").trim() ?? cityLine,
        state: cityMatch?.[2]?.toUpperCase() || borrower.state,
        zip: cityMatch?.[3] || borrower.zip,
      },
    };
  }
  if (field === "highestDegree") {
    const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
    const graduated = lines.find((line) => /^graduated\s+/i.test(line));
    const year = graduated?.replace(/^[^\d]*/, "") ?? borrower.graduationYear;
    const rest = lines.filter((line) => !/^graduated\s+/i.test(line));
    return {
      borrower: {
        ...borrower,
        degree: rest[0] ?? "",
        school: rest[1] ?? "",
        graduationYear: year,
      },
    };
  }
  if (field === "employmentStatus") {
    const job = application.employment[0];
    if (!job) return {};
    return { employment: [{ ...job, status: next }, ...application.employment.slice(1)] };
  }
  if (field === "hasCosigner") {
    const yes = /^(y|yes)$/i.test(next);
    if (yes) return { cosigner: application.cosigner ?? emptyPerson() };
    return { cosigner: null };
  }
  const current = application.cosigner ?? emptyPerson();
  if (field === "cosignerName") return { cosigner: { ...current, fullName: next } };
  if (field === "cosignerEmail") return { cosigner: { ...current, email: next } };
  return { cosigner: { ...current, relationship: next } };
}
