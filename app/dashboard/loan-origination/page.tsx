import { Suspense } from "react";
import { QueueTable } from "@/components/queue/QueueTable";

export default function LoanOriginationPage() {
  return (
    <Suspense fallback={<p className="px-xl py-md text-sm text-gray-medium">Loading queue…</p>}>
      <QueueTable />
    </Suspense>
  );
}
