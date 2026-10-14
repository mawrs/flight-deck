import type { ReactNode } from "react";
import { OpsProvider } from "@/lib/ops-store";
import { StoreProvider } from "@/lib/store";

export default function EmailsLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <OpsProvider>{children}</OpsProvider>
    </StoreProvider>
  );
}
