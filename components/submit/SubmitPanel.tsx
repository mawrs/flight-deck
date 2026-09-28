"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useFileWorkspace } from "@/components/application/file-context";
import { StageIntro } from "@/components/application/StageIntro";
import { WorkbookActions } from "@/components/application/WorkbookActions";
import { FlagLine } from "@/components/shared/FlagLine";
import { Select } from "@/components/ui/Dropdown";
import { seniorChanges } from "@/lib/diffs";
import { useStore } from "@/lib/store";
import { canSubmitToSenior, submissionChecklist } from "@/lib/validation";
import { calculate } from "@/lib/calculations";
import { money, percent } from "@/lib/format";
import type { Application, Decision } from "@/lib/types";

const decisions: Decision[] = ["", "approve", "counter-offer", "deny", "needs-docs"];

export function SubmitPanel({ application }: { application: Application }) {
  const router = useRouter();
  const { mode, readOnly } = useFileWorkspace();
  const { updateApplication, submitToSenior, completeSeniorReview } = useStore();
  const items = submissionChecklist(application);
  const ready = canSubmitToSenior(application);
  const alreadySubmitted =
    application.status === "senior-review" || application.status === "approved";
  const needsDocs = application.decision === "needs-docs";
  const calc = calculate(application);
  const blockers = items.filter((item) => !item.done);
  const changes = seniorChanges(application);
  const locked = readOnly;

  return (
    <StageIntro
      title="Completion"
      lede="Open the master workbook in a new window to cross-check the file, upload the completed copy, then send to second-level review."
    >

      <div className="flex flex-col gap-md p-md">
      <WorkbookActions
        application={application}
        readOnly={locked}
        onUploaded={(fileName) =>
          updateApplication(application.id, {
            workbookFileName: fileName,
            workbookUploadedAt: new Date().toISOString(),
          })
        }
      />

      <section className="uw-card-pad">
        <h2 className="text-sm font-semibold text-navy">Package contents</h2>
        <dl className="mt-sm space-y-sm text-sm">
          <div className="flex justify-between gap-md">
            <dt className="text-gray-medium">Income summary</dt>
            <dd>{money(calc.monthlyIncome)} / mo</dd>
          </div>
          <div className="flex justify-between gap-md">
            <dt className="text-gray-medium">Payoff total</dt>
            <dd>{money(calc.selectedPayoffTotal)}</dd>
          </div>
          <div className="flex justify-between gap-md">
            <dt className="text-gray-medium">Borrower monthly debt</dt>
            <dd>{money(calc.qualifyingMonthlyDebt)}</dd>
          </div>
          <div className="flex justify-between gap-md">
            <dt className="text-gray-medium">Debt to income</dt>
            <dd>{percent(calc.dti)}</dd>
          </div>
          <div className="flex justify-between gap-md">
            <dt className="text-gray-medium">Comments</dt>
            <dd>
              {Object.values(application.notes).filter((value) => value.trim()).length} of 7
            </dd>
          </div>
        </dl>
      </section>

      {blockers.length ? (
        <FlagLine tone="warn">
          Not ready to submit:
          <ul className="mt-xs list-disc pl-md">
            {blockers.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </FlagLine>
      ) : (
        <FlagLine tone="good">
          Everything checks out. Submitting sends this package to second-level review.
        </FlagLine>
      )}

      {mode === "primary" ? (
        <section className="uw-card-pad">
          <h2 className="text-sm font-semibold text-navy">Decision</h2>
          <Select
            variant="input"
            className="mt-sm"
            value={application.decision}
            disabled={locked}
            aria-label="Decision"
            options={decisions.map((item) => ({
              id: item,
              label: item || "Select a decision",
            }))}
            onChange={(decision) =>
              updateApplication(application.id, {
                decision: decision as Decision,
              })
            }
          />
          <p className="mt-sm text-sm text-gray-dark">
            {needsDocs
              ? "This keeps the file in the pre-review queue as needs documentation. It does not send a customer letter."
              : "This moves the file into the senior queue. Saving a draft sends nothing to the applicant."}
          </p>
          <Button
            disabled={!ready || alreadySubmitted}
            size="small"
            className="mt-sm"
            onClick={() => {
              if (!canSubmitToSenior(application)) return;
              submitToSenior(application.id);
              router.push(needsDocs ? "/dashboard/loan-origination" : "/dashboard/loan-origination?view=final-review");
            }}
          >
            {alreadySubmitted
              ? "Already in senior review"
              : needsDocs
                ? "Save as needs documentation"
                : "Submit to senior underwriter"}
          </Button>
        </section>
      ) : (
        <section className="uw-card-pad">
          <h2 className="text-sm font-semibold text-navy">Second-level review</h2>
          <p className="mt-xs text-sm text-gray-dark">
            Independent review: update any field you flag. Primary values remain in the audit snapshot.
          </p>
          {changes.length > 0 ? (
            <ul className="mt-sm space-y-xs text-sm">
              {changes.map((change) => (
                <li key={change.path}>
                  <span className="font-semibold text-orange">{change.label}:</span> {change.before}{" "}
                  → {change.after}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-sm text-sm text-gray-medium">
              No changes yet. Everything arrived pre-filled from the first underwriter.
            </p>
          )}
          <textarea
            className="uw-input mt-sm w-full"
            rows={3}
            disabled={locked}
            value={application.seniorNotes}
            onChange={(event) =>
              updateApplication(application.id, { seniorNotes: event.target.value })
            }
            placeholder="Independent observations and anything returned to the primary underwriter"
          />
          <div className="mt-sm flex flex-wrap gap-sm">
            <Button
              disabled={locked}
              size="small"
              onClick={() => {
                completeSeniorReview(application.id, "approve");
                router.push("/dashboard/loan-origination?view=final-review");
              }}
            >
              Complete second-level review
            </Button>
            <Button
              disabled={locked}
              variant="warning"
              size="small"
              onClick={() => {
                completeSeniorReview(application.id, "return-to-uw");
                router.push("/dashboard/loan-origination");
              }}
            >
              Return to underwriter
            </Button>
          </div>
        </section>
      )}
      </div>
    </StageIntro>
  );
}
