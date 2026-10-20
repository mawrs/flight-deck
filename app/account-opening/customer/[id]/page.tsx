import { CustomerApplication } from "@/components/account-opening/CustomerApplication";

export default async function CustomerAccountOpeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerApplication id={id} />;
}
