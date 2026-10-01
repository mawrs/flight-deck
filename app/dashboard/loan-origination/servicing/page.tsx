import { Suspense } from "react";
import { ServicingQueue } from "@/components/ops/ServicingQueue";

export default function ServicingPage() {
  return (
    <Suspense fallback={<p className="uw-page-status">Loading servicing…</p>}>
      <ServicingQueue />
    </Suspense>
  );
}
