import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { OpsProvider } from "@/lib/ops-store";
import { ConsoleShell } from "./ConsoleShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const expanded = cookieStore.get("sidebar")?.value === "open";
  return (
    <OpsProvider>
      <ConsoleShell initialExpanded={expanded}>{children}</ConsoleShell>
    </OpsProvider>
  );
}
