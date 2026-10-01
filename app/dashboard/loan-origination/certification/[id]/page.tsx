import { CertificationFile } from "@/components/ops/CertificationFile";

export default async function CertificationFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CertificationFile id={id} />;
}
