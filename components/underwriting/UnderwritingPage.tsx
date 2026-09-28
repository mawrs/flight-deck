"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { BorrowerInformation } from "@/components/underwriting/BorrowerInformation";
import { IncomeCalculatorPanel } from "@/components/underwriting/IncomeCalculator";
import { UnderwritingLiabilities } from "@/components/underwriting/UnderwritingLiabilities";
import { UnderwritingPayoff } from "@/components/underwriting/UnderwritingPayoff";
import { useApplication } from "@/lib/store";

const PANELS = [
  { id: "borrower", label: "Borrower Information" },
  { id: "payoff", label: "Pay Off" },
  { id: "income", label: "Income Calculator" },
  { id: "liabilities", label: "Liabilities" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

export function UnderwritingPage() {
  const { id, basePath, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [panel, setPanel] = useState<PanelId>("borrower");
  if (!application) return null;

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Underwriting</h1>
      </div>
      <nav
        className="uw-section-tabs"
        aria-label="Underwriting sections"
      >
        {PANELS.map((item) => {
          const active = item.id === panel;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setPanel(item.id)}
              className="uw-section-tab"
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {panel === "borrower" ? (
        <BorrowerInformation
          application={application}
          basePath={basePath}
          readOnly={readOnly}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}

      {panel === "payoff" ? (
        <UnderwritingPayoff
          application={application}
          readOnly={readOnly}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}

      {panel === "income" ? (
        <IncomeCalculatorPanel
          application={application}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}

      {panel === "liabilities" ? (
        <UnderwritingLiabilities
          application={application}
          readOnly={readOnly}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}
    </div>
  );
}
