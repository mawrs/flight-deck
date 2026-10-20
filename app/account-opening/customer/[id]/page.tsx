import { CustomerApplication } from "@/components/account-opening/CustomerApplication";

export default async function CustomerAccountOpeningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ apply?: string }>;
}) {
  const { id } = await params;
  const { apply } = await searchParams;
  return <CustomerApplication id={id} startAtLogin={apply === "1"} />;
}
