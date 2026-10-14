import { ADVISORS } from "./ops-data";

export const CURRENT_USER = "Demo Account";

export const MENTION_PEOPLE = [CURRENT_USER, ...ADVISORS];

export function mentionQuery(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? "")) return null;
  const query = before.slice(at + 1);
  if (query.includes("\n")) return null;
  return { start: at, query };
}

export function mentionMatches(query: string) {
  const exact = query.trim().toLowerCase();
  if (query.endsWith(" ") && MENTION_PEOPLE.some((name) => name.toLowerCase() === exact)) return [];
  return MENTION_PEOPLE.filter((name) => name.toLowerCase().startsWith(exact));
}

export function mentionedPeople(body: string) {
  const ordered = [...MENTION_PEOPLE].sort((left, right) => right.length - left.length);
  return ordered.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)@${escaped}(?=$|\\s|[.,!?;:])`, "i").test(body);
  });
}
