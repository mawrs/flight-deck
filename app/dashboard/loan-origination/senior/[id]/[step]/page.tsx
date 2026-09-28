import { FileStep } from "../../../FileStep";

export default async function SeniorStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id, step } = await params;
  return <FileStep id={id} step={step} senior />;
}
