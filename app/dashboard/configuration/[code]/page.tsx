import { notFound } from "next/navigation";
import { codeBySlug } from "../codes";
import { CodeDetail } from "./CodeDetail";

export default async function ConfigurationCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const name = codeBySlug(code);
  if (!name) notFound();
  return <CodeDetail name={name} />;
}
