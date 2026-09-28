import type { ReactNode } from "react";
import { FileWorkspace } from "@/components/application/FileWorkspace";

export default async function ApplicationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <FileWorkspace id={id} mode="primary">
      {children}
    </FileWorkspace>
  );
}
