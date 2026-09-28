"use client";

import { Button } from "@/components/Button";

export function OpenWorkbookButton({
  id,
  variant = "link",
}: {
  id: string;
  variant?: "link" | "button";
}) {
  function open() {
    window.open(
      `/dashboard/loan-origination/workbook/${id}`,
      `elfi-workbook-${id}`,
      "noopener,noreferrer,width=1280,height=860",
    );
  }

  return (
    <Button variant={variant === "button" ? "primary" : "text"} size="small" onClick={open}>
      Master workbook
      {variant === "link" ? (
        <span aria-hidden>
          ↗
        </span>
      ) : null}
    </Button>
  );
}
