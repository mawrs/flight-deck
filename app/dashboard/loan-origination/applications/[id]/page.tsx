import { redirect } from "next/navigation";
import { applicationBase } from "@/lib/loan-routes";

export default async function ApplicationIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`${applicationBase(id)}/opportunity`);
}
