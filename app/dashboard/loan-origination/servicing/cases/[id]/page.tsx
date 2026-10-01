import { CaseFile } from "@/components/ops/CaseFile";

export default async function ServicingCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseFile id={id} />;
}
