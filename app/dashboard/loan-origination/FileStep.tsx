import { notFound, redirect } from "next/navigation";
import { OpportunityPage } from "@/components/application/OpportunityPage";
import { ReviewPage } from "@/components/application/ReviewPage";
import { DocumentsPage } from "@/components/documents/DocumentsPage";
import { NotesPage } from "@/components/notes/NotesPage";
import { PayoffsPage } from "@/components/payoffs/PayoffsPage";
import { SubmitPage } from "@/components/submit/SubmitPage";
import { RatesPage } from "@/components/underwriting/RatesPage";
import { UnderwritingPage } from "@/components/underwriting/UnderwritingPage";
import { applicationBase } from "@/lib/loan-routes";

export function FileStep({ id, step, senior }: { id: string; step: string; senior: boolean }) {
  const base = applicationBase(id, senior);
  if (step === "dti") redirect(`${base}/payoffs`);
  if (step === "income") redirect(`${base}/underwriting`);

  switch (step) {
    case "opportunity":
      return <OpportunityPage />;
    case "notes":
      return <NotesPage />;
    case "payoffs":
      return <PayoffsPage />;
    case "loan-payoff":
      return <PayoffsPage mode="payoff" />;
    case "review":
      return <ReviewPage />;
    case "documents":
      return <DocumentsPage />;
    case "underwriting":
      return <UnderwritingPage />;
    case "rates":
      return <RatesPage />;
    case "submit":
      return <SubmitPage />;
    default:
      notFound();
  }
}
