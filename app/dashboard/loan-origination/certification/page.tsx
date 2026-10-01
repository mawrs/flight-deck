import { Suspense } from "react";
import { CertificationQueue } from "@/components/ops/CertificationQueue";

export default function CertificationPage() {
  return (
    <Suspense fallback={<p className="uw-page-status">Loading certifications…</p>}>
      <CertificationQueue />
    </Suspense>
  );
}
