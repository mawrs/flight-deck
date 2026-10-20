import type { Metadata } from "next";
import { AccountOpeningQueue } from "@/components/account-opening/AccountOpeningQueue";

export const metadata: Metadata = {
  title: "Account Opening",
};

export default function AccountOpeningPage() {
  return <AccountOpeningQueue />;
}
