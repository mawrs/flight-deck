import type { Metadata } from "next";
import { NewAccountOpening } from "@/components/account-opening/NewAccountOpening";

export const metadata: Metadata = {
  title: "Start account opening",
};

export default function NewAccountOpeningPage() {
  return <NewAccountOpening />;
}
