"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ComboSearch, Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import type { SearchChoice } from "@/lib/search";

const LOAN = {
  loanNo: "1410263",
  firstName: "Sarah",
  lastName: "West",
  ssn: "XXX-XX-0250",
  dob: "08/30/1992",
  yearStart: "08/2026",
  yearEnd: "05/2027",
  graduation: "05/2030",
  type: "ELM",
};

const LOAN_FIELDS: SearchChoice<"loan-number">[] = [
  { id: "loan-number", label: "Loan No", prompt: "Search for a loan number", aria: "Search loan number" },
];

const LOAN_OPTIONS = [{ id: LOAN.loanNo, label: LOAN.loanNo }];

const TYPES = [
  { id: "ELM", label: "ELM" },
  { id: "Scholarnet", label: "Scholarnet" },
];

export function Recertification() {
  const [loanNo, setLoanNo] = useState(LOAN.loanNo);
  const [firstName, setFirstName] = useState(LOAN.firstName);
  const [lastName, setLastName] = useState(LOAN.lastName);
  const [ssn, setSsn] = useState(LOAN.ssn);
  const [dob, setDob] = useState(LOAN.dob);
  const [yearStart, setYearStart] = useState(LOAN.yearStart);
  const [yearEnd, setYearEnd] = useState(LOAN.yearEnd);
  const [graduation, setGraduation] = useState(LOAN.graduation);
  const [type, setType] = useState(LOAN.type);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");

  function onLoanQuery(next: string) {
    setLoanNo(next);
    setNotice("");
    if (next.trim() === LOAN.loanNo) {
      setFirstName(LOAN.firstName);
      setLastName(LOAN.lastName);
      setSsn(LOAN.ssn);
      setDob(LOAN.dob);
      setYearStart(LOAN.yearStart);
      setYearEnd(LOAN.yearEnd);
      setGraduation(LOAN.graduation);
      setType(LOAN.type);
      return;
    }
    setFirstName("");
    setLastName("");
    setSsn("");
    setDob("");
    setYearStart("");
    setYearEnd("");
    setGraduation("");
    setType("");
    setConfirm(false);
  }

  const originalType = loanNo.trim() === LOAN.loanNo ? LOAN.type : "";
  const typeChanged = Boolean(originalType && type && type !== originalType);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-lg overflow-auto p-xl"
      onSubmit={(event) => {
        event.preventDefault();
        if (!confirm || !type) return;
        setNotice("Re-certification requested.");
      }}
    >
      <ComboSearch
        value={loanNo}
        field="loan-number"
        fields={LOAN_FIELDS}
        options={LOAN_OPTIONS}
        placeholder="Search loan number"
        matchWidth
        onChange={onLoanQuery}
        onFieldChange={() => {}}
      />
      <div className="grid grid-cols-2 gap-lg">
        <FloatInput label="Student First Name" value={firstName} readOnly />
        <FloatInput label="Student Last Name" value={lastName} readOnly />
      </div>
      <div className="grid grid-cols-3 gap-lg">
        <FloatInput label="Student SSN" value={ssn} readOnly />
        <FloatInput label="Student DOB" value={dob} readOnly />
        <div className="flex min-w-0 flex-col gap-sm">
          <Select
            variant="float"
            label="Certification Type"
            aria-label="Certification Type"
            value={type}
            placeholder=" "
            options={TYPES}
            disabled={!originalType}
            onChange={setType}
          />
          {typeChanged ? (
            <p className="rounded-xs border border-warning bg-warning-bg px-md py-sm text-sm text-black">
              You are changing the certification system from {originalType} to {type}.
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-lg">
        <FloatInput label="Current Academic Year Start Date" value={yearStart} onChange={setYearStart} />
        <FloatInput label="Current Academic Year End Date" value={yearEnd} onChange={setYearEnd} />
        <FloatInput label="Graduation Date" value={graduation} onChange={setGraduation} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <label className="flex items-center gap-sm text-sm text-black">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(event) => setConfirm(event.target.checked)}
            className="size-5 rounded-xs border-gray-light accent-primary"
          />
          Are you sure you want to submit the Recertification request?
        </label>
        <Button type="submit" disabled={!confirm || !type}>
          Save & Request Re-certification
        </Button>
      </div>
      {notice ? <p className="text-sm text-gray-medium">{notice}</p> : null}
    </form>
  );
}
