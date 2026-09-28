import type { FlagTone } from "@/lib/workflow";

const toneClass: Record<FlagTone, string> = {
  good: "bg-success-bg text-success-hover",
  warn: "bg-warning-bg text-charcoal",
  bad: "bg-error-bg text-error-hover",
};

export function FlagLine({
  tone,
  children,
}: {
  tone: FlagTone;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-sm px-[11px] py-[9px] text-sm leading-md ${toneClass[tone]}`}>
      {children}
    </div>
  );
}

export function FlagList({
  flags,
}: {
  flags: { tone: FlagTone; text: string }[];
}) {
  if (!flags.length) return null;
  return (
    <div className="space-y-sm">
      {flags.map((flag) => (
        <FlagLine key={flag.text} tone={flag.tone}>
          {flag.text}
        </FlagLine>
      ))}
    </div>
  );
}
