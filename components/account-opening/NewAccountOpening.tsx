"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Combobox, Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { customerByAccount, KNOWN_CUSTOMERS, normalizeAccount } from "@/lib/account-opening-data";
import { createOpening } from "@/lib/account-opening-store";
import type { AccountOpeningChannel } from "@/lib/account-opening-types";

export function NewAccountOpening() {
  const router = useRouter();
  const [channel, setChannel] = useState<AccountOpeningChannel>("call-center");
  const [relationship, setRelationship] = useState<"existing" | "new">("existing");
  const [customerName, setCustomerName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const match = relationship === "existing" ? customerByAccount(accountNumber) : null;
  const jordan = normalizeAccount(accountNumber) === "0048219931";
  const customerOptions = KNOWN_CUSTOMERS.map((customer) => ({
    id: customer.accountNumber,
    label: customer.fullName,
    detail: customer.accountNumber,
  }));
  const missing = relationship === "existing" ? accountNumber.trim().length === 0 : fullName.trim().length === 0 || phone.trim().length === 0;

  function start() {
    const id = createOpening({
      channel,
      relationship,
      accountNumber,
      fullName,
      phone,
      email,
      attachSampleCall: jordan,
    });
    router.push(`/dashboard/loan-origination/account-opening/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white min-[1100px]:flex-row min-[1100px]:items-stretch">
      <section className="flex min-w-0 flex-col border-b border-gray-light min-[1100px]:flex-1 min-[1100px]:border-b-0">
        <div className="uw-card-header">
          <h1 className="text-lg text-black">Start account opening</h1>
        </div>
        <div className="grid gap-md p-lg">
          <Select
            variant="float"
            label="Channel"
            value={channel}
            options={[
              { id: "call-center", label: "Call center" },
              { id: "branch-event", label: "Branch event / shared tablet" },
            ]}
            onChange={(value) => setChannel(value as AccountOpeningChannel)}
          />
          <Select
            variant="float"
            label="Customer"
            value={relationship}
            options={[
              { id: "existing", label: "Existing customer" },
              { id: "new", label: "New customer" },
            ]}
            onChange={(value) => setRelationship(value as "existing" | "new")}
          />
          {relationship === "existing" ? (
            <Combobox
              label="Customer name"
              value={customerName}
              selectedId={accountNumber}
              initiallyOpen={false}
              options={customerOptions}
              onChange={setCustomerName}
              onQueryChange={(next) => {
                if (match && next.trim() !== match.fullName) setAccountNumber("");
              }}
              onSelect={(option) => {
                setCustomerName(option.label);
                setAccountNumber(option.id);
              }}
            />
          ) : (
            <>
              <FloatInput label="Full name" value={fullName} onChange={setFullName} />
              <FloatInput label="Phone" value={phone} type="tel" onChange={setPhone} />
              <FloatInput label="Email" value={email} type="email" onChange={setEmail} />
            </>
          )}
          <div>
            <Button disabled={missing} onClick={start}>
              Open workspace
            </Button>
          </div>
        </div>
      </section>
      <section className="flex min-w-0 flex-col border-t border-gray-light min-[1100px]:flex-1 min-[1100px]:border-t-0 min-[1100px]:border-l">
        <div className="uw-card-header">
          <h2 className="text-lg text-black">Customer profile</h2>
        </div>
        <dl className="flex flex-col gap-md p-lg">
          {match ? (
            <>
              <ProfileItem label="Name" value={match.fullName} />
              <ProfileItem label="Customer ID" value={match.customerId} />
              <ProfileItem label="Relationship" value={match.existingAccount} />
              <ProfileItem label="Email" value={match.email} />
              <ProfileItem label="Phone" value={match.phone} />
            </>
          ) : (
            <p className="text-sm text-gray-medium">
              {relationship === "existing" && accountNumber.trim()
                ? "No customer profile matched that account number."
                : "Profile fields appear after a customer is selected."}
            </p>
          )}
        </dl>
      </section>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-xs text-gray-medium">{label}</dt>
      <dd className="text-sm text-black">{value}</dd>
    </div>
  );
}
