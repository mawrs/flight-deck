import { AmendedTils } from "@/components/ops/AmendedTils";
import { ChangeTransactions } from "@/components/ops/ChangeTransactions";
import { EdMedBoardedLoans } from "@/components/ops/EdMedBoardedLoans";
import { EdMedDisbursements } from "@/components/ops/EdMedDisbursements";
import { InSchoolDisbursements } from "@/components/ops/InSchoolDisbursements";
import { InSchoolList } from "@/components/ops/InSchoolList";
import { OutstandingElfiChecks } from "@/components/ops/OutstandingElfiChecks";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { servicingReportHref } from "@/lib/loan-routes";
import { REPORTS, type ReportId } from "@/lib/ops-logic";

export function ServicingReports({ report }: { report: ReportId }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <SectionTabs
        label="Reports"
        current={report}
        tabs={REPORTS.map((item) => ({
          id: item.id,
          label: item.label,
          href: servicingReportHref(item.id),
        }))}
      />
      {report === "edmed" ? (
        <EdMedDisbursements />
      ) : report === "edmed-boarded" ? (
        <EdMedBoardedLoans />
      ) : report === "inschool" ? (
        <InSchoolDisbursements />
      ) : report === "inschool-list" ? (
        <InSchoolList />
      ) : report === "amended-tils" ? (
        <AmendedTils />
      ) : report === "elfi-checks" ? (
        <OutstandingElfiChecks />
      ) : report === "change-transactions" ? (
        <ChangeTransactions />
      ) : null}
    </div>
  );
}
