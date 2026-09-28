"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { RateOffers } from "@/components/underwriting/RateOffers";
import { RatesTable } from "@/components/underwriting/RatesTable";
import { useApplication } from "@/lib/store";
import type { RateProduct } from "@/lib/calculations/rates";

const PRODUCTS: { id: RateProduct; label: string }[] = [
  { id: "immediate", label: "Immediate" },
  { id: "fixed", label: "Fixed" },
  { id: "interest-only", label: "Interest Only" },
  { id: "deferred", label: "Deferred" },
];

export function RatesPage() {
  const { id, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [product, setProduct] = useState<RateProduct>("immediate");
  if (!application) return null;

  function select(patch: Parameters<typeof updateApplication>[1]) {
    updateApplication(id, patch);
  }

  return (
    <div className="flex flex-col">
      <section className="bg-white">
        <div className="uw-card-header">
          <h1 className="text-lg text-black">Rates</h1>
          <p className="flex items-center gap-sm text-sm text-gray-dark">
            <span className="size-[14px] rounded-xs bg-yellow" aria-hidden />
            Color = selected
          </p>
        </div>
        <nav
          className="uw-section-tabs"
          aria-label="Rate products"
        >
          {PRODUCTS.map((item) => {
            const active = item.id === product;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setProduct(item.id)}
                className="uw-section-tab"
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <RatesTable
          application={application}
          product={product}
          readOnly={readOnly}
          onSelect={select}
        />
      </section>
      <RateOffers application={application} product={product} />
    </div>
  );
}
