import { LoanAccount } from "@/components/ops/LoanAccount";

export default async function ServicingLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoanAccount id={id} />;
}