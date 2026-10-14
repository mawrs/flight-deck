import { MENTION_PEOPLE } from "@/lib/mentions";

export function MentionText({ body }: { body: string }) {
  const ordered = [...MENTION_PEOPLE].sort((left, right) => right.length - left.length);
  const pattern = new RegExp(`(@(?:${ordered.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))`, "gi");
  const parts = body.split(pattern);
  return parts.map((part, index) =>
    part.startsWith("@") && ordered.some((name) => name.toLowerCase() === part.slice(1).toLowerCase()) ? (
      <span key={index} className="text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
