"use client";

import { useState } from "react";
import { SingleSend } from "@/app/dashboard/emails/SingleSend";
import { Button } from "@/components/Button";
import { EmailTemplatePicker } from "@/components/email/EmailTemplatePicker";
import { emailHtml, emailsForApplication, sentStamp, type CustomerEmail } from "@/lib/customer-emails";
import { CURRENT_USER } from "@/lib/mentions";
import { useOps } from "@/lib/ops-store";
import { useStore } from "@/lib/store";

export function CustomerEmails({
  applicationId,
  caseId = "",
}: {
  applicationId?: string | null;
  caseId?: string;
}) {
  const ops = useOps();
  const { getApplication } = useStore();
  const application = applicationId ? getApplication(applicationId) : undefined;
  const borrowerEmail = application?.borrower.email ?? "";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [template, setTemplate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sent = (ops.feed ?? [])
    .filter((post) => post.kind === "email" && post.audience === "customer")
    .filter((post) => {
      if (applicationId && post.applicationId === applicationId) return true;
      if (caseId && post.caseId === caseId) return true;
      const address = borrowerEmail.toLowerCase();
      return Boolean(address) && (post.emailTo ?? "").toLowerCase() === address;
    })
    .map(
      (post): CustomerEmail => ({
        id: post.id,
        title: post.subject?.trim() || "Email",
        sentAt: post.createdAt,
        body: post.body,
        emailTo: post.emailTo,
        emailCc: post.emailCc,
        emailBcc: post.emailBcc,
      }),
    );

  const emails = [...(application ? emailsForApplication(application) : []), ...sent].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
  const open = emails.find((email) => email.id === openId) ?? null;

  function closeComposer() {
    setPickerOpen(false);
    setTemplate(null);
  }

  return (
    <div className="flex min-h-0 flex-col bg-white">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">Email Communication</h2>
        <Button
          variant="link"
          size="small"
          icon={<PlusIcon />}
          aria-expanded={pickerOpen || Boolean(template)}
          onClick={() => (pickerOpen || template ? closeComposer() : setPickerOpen(true))}
        >
          Send new email
        </Button>
      </div>
      {template ? (
        <SingleSend
          embedded
          templateTitle={template}
          applicantName={application?.borrower.fullName}
          applicantEmail={borrowerEmail}
          applicationId={applicationId ?? undefined}
          caseId={caseId || undefined}
          hideFooter
          directSend
          doneLabel="Return to emails"
          onCancel={closeComposer}
          onSent={({ subject, body, to, cc, bcc }) => {
            ops.sendCustomerEmail(caseId, CURRENT_USER, {
              to: to.trim() || borrowerEmail,
              cc,
              bcc,
              subject,
              body,
              applicationId: applicationId ?? undefined,
            });
            closeComposer();
          }}
        />
      ) : open ? (
        <SingleSend
          embedded
          readOnly
          templateTitle={open.title}
          body={emailHtml(open.body)}
          sentLabel={sentStamp(open.sentAt)}
          applicantName={application?.borrower.fullName}
          applicantEmail={open.emailTo || borrowerEmail}
          initialCc={open.emailCc}
          initialBcc={open.emailBcc}
          hideFooter
          onCancel={() => setOpenId(null)}
        />
      ) : (
        <>
          {pickerOpen ? (
            <EmailTemplatePicker
              idPrefix={`case-email-${caseId || applicationId || "new"}`}
              onCancel={closeComposer}
              onNext={(next) => {
                setTemplate(next);
                setPickerOpen(false);
              }}
            />
          ) : null}
          {emails.length === 0 ? (
            <p className="px-xl py-lg text-sm text-gray-medium">No emails have been sent to this customer.</p>
          ) : (
            <div className="flex flex-col px-md py-md">
              {emails.map((email, index) => (
                <div key={email.id} className={index === 0 ? "py-sm" : "border-t border-gray-light py-sm"}>
                  <button
                    type="button"
                    className="flex items-center gap-sm text-left text-sm text-primary"
                    onClick={() => setOpenId(email.id)}
                  >
                    <img src="/dashboard/email.svg" alt="" width={16} height={16} />
                    {email.title}
                  </button>
                  <p className="text-xs text-gray-medium">Sent {sentStamp(email.sentAt)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <path
        d="M11.55 4.2C11.55 3.61921 11.0808 3.15 10.5 3.15C9.91921 3.15 9.45 3.61921 9.45 4.2V9.45H4.2C3.61921 9.45 3.15 9.91921 3.15 10.5C3.15 11.0808 3.61921 11.55 4.2 11.55H9.45V16.8C9.45 17.3808 9.91921 17.85 10.5 17.85C11.0808 17.85 11.55 17.3808 11.55 16.8V11.55H16.8C17.3808 11.55 17.85 11.0808 17.85 10.5C17.85 9.91921 17.3808 9.45 16.8 9.45H11.55V4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
