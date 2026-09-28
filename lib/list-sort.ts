export type SortDirection = "asc" | "desc";

export function compareSortValues(a: string | number, b: string | number, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * sign;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }) * sign;
}

export function timeValue(value: string | null | undefined) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}
