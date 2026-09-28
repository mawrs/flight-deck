import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplicationDetails } from "./ApplicationDetails";
import { getRequest, REQUESTS } from "../requests";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return REQUESTS.map((row) => ({ id: row.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const request = getRequest(id);
  return { title: request ? request.customer : "Application" };
}

export default async function ApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const request = getRequest(id);
  if (!request) notFound();
  return <ApplicationDetails request={request} />;
}
