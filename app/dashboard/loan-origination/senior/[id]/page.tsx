import { redirect } from "next/navigation";
import { applicationBase } from "@/lib/loan-routes";

export default async function SeniorIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`${applicationBase(id, true)}/opportunity`);
}
