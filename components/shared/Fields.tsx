export function SourceHint({ source }: { source?: string }) {
  if (!source) return null;
  return <div className="mt-xs text-[11px] text-gray-medium">From: {source}</div>;
}

export function ReadField({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source?: string;
}) {
  return (
    <div className="text-xs text-gray-medium">
      {label}
      <div className="mt-xs text-sm text-charcoal">{value}</div>
      <SourceHint source={source} />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  readOnly,
  compact,
  source,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  readOnly: boolean;
  compact?: boolean;
  source?: string;
}) {
  const input = readOnly ? (
    <div className="mt-xs text-sm text-charcoal">{value}</div>
  ) : (
    <input
      type="number"
      className={`uw-input ${compact ? "w-28" : "mt-xs block w-full"}`}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
    />
  );
  if (!label) return input;
  return (
    <label className="text-xs text-gray-medium">
      {label}
      {input}
      <SourceHint source={source} />
    </label>
  );
}
