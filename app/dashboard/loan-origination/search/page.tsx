import { LoanSearch } from "@/components/search/LoanSearch";

export default async function LoanSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <LoanSearch initialQuery={q ?? ""} />;
}
