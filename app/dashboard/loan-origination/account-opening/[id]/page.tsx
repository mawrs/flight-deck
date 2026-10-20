import type { Metadata } from "next";
import { AccountOpeningWorkspace } from "@/components/account-opening/AccountOpeningWorkspace";

export const metadata: Metadata = {
  title: "Account opening",
};

export default async function AccountOpeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountOpeningWorkspace id={id} />;
}
