"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { OPPORTUNITY_STAGES, SUPERVISOR_STAGE_INDEX, stageIndexFor } from "@/lib/stages";
import { useApplication } from "@/lib/store";

export function StagePath({ id }: { id: string }) {
  const { application, updateApplication } = useApplication(id);
  const current = application ? stageIndexFor(application) : 0;
  const [selected, setSelected] = useState(current);
  const [toast, setToast] = useState<string | null>(null);
  const [justComplete, setJustComplete] = useState<number[]>([]);
  const prevCurrent = useRef<number | null>(null);

  useEffect(() => {
    setSelected(current);
  }, [current]);

  useEffect(() => {
    if (prevCurrent.current == null) {
      prevCurrent.current = current;
      return;
    }
    const prev = prevCurrent.current;
    prevCurrent.current = current;
    if (current <= prev) return;
    const indices = Array.from({ length: current - prev }, (_, offset) => prev + offset);
    setJustComplete(indices);
    const done = window.setTimeout(() => setJustComplete([]), (indices.length - 1) * 90 + 640);
    return () => window.clearTimeout(done);
  }, [current]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!application) return null;

  const lastIndex = OPPORTUNITY_STAGES.length - 1;
  const target = selected === current ? Math.min(current + 1, lastIndex) : selected;
  const atEnd = current >= lastIndex;

  function setStage(index: number) {
    const next = OPPORTUNITY_STAGES[index];
    if (!next || index === current) return;
    updateApplication(id, {
      stage: next.label,
      opportunity: { stage: next.label },
    });
    setSelected(index);
    setToast(next.label);
  }

  function complete() {
    if (atEnd) return;
    setStage(target);
  }

  return (
    <div className="relative z-10 flex items-center gap-md overflow-visible border-b border-gray-light bg-white px-xl py-sm">
      <ol className="uw-path min-w-0 flex-1" aria-label="Opportunity stage">
        {OPPORTUNITY_STAGES.map((stage, index) => {
          const completeStep = index < current;
          const isCurrent = index === current;
          const isSelected = index === selected && index !== current;
          const freshlyComplete = justComplete.includes(index);
          const state = completeStep ? "complete" : isCurrent ? "current" : "future";
          const delay = freshlyComplete ? justComplete.indexOf(index) * 90 : 0;
          return (
            <li key={stage.id} className="relative flex min-w-0">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                aria-pressed={isSelected}
                aria-describedby={`stage-tip-${stage.id}`}
                aria-label={
                  completeStep
                    ? `${stage.label}, complete`
                    : index >= SUPERVISOR_STAGE_INDEX
                      ? `${stage.label} — Senior Underwriter (Supervisor)`
                      : stage.label
                }
                onClick={() => {
                  if (index < current) {
                    setStage(index);
                    return;
                  }
                  setSelected(index);
                }}
                className={`uw-path-step uw-path-step-${state}${isSelected ? " uw-path-step-selected" : ""}${freshlyComplete ? " uw-path-step-just-complete" : ""}`}
                style={freshlyComplete ? { ["--path-delay" as string]: `${delay}ms` } : undefined}
              >
                {completeStep ? (
                  <>
                    <span className="sr-only">{stage.label}, complete</span>
                    <CheckIcon animated={freshlyComplete} delay={delay} />
                  </>
                ) : (
                  <span className="uw-path-name">{stage.label}</span>
                )}
              </button>
              <span id={`stage-tip-${stage.id}`} role="tooltip" className="uw-path-tip">
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
      <Button className="shrink-0 whitespace-nowrap" disabled={atEnd} onClick={complete}>
        <CheckIcon />
        Mark Stage as Complete
      </Button>
      {toast ? <StageToast label={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

function StageToast({ label, onClose }: { label: string; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="status"
      className="uw-toast"
    >
      <SuccessCheckIcon />
      <p>Stage successfully changed to {label}.</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-white hover:bg-success-hover"
      >
        <CloseIcon />
      </button>
    </div>,
    document.body,
  );
}

function CheckIcon({ animated = false, delay = 0 }: { animated?: boolean; delay?: number }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={`uw-path-check shrink-0${animated ? " uw-path-check-in" : ""}`}
      style={animated ? { ["--path-delay" as string]: `${delay}ms` } : undefined}
    >
      <path
        d="M2.5 7.2l2.8 2.8 6.2-6.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10.2l2.4 2.4 4.6-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
