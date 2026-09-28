import styles from "./FilterTags.module.css";

export type FilterTagItem = {
  id: string;
  label: string;
  onRemove: () => void;
};

export function FilterTags({
  tags,
  onClearAll,
  className,
}: {
  tags: FilterTagItem[];
  onClearAll?: () => void;
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={[styles.tags, className].filter(Boolean).join(" ")}>
      {tags.map((tag) => (
        <span className={styles.tag} key={tag.id}>
          <span className={styles.label}>{tag.label}</span>
          <button className={styles.remove} type="button" aria-label={`Remove ${tag.label}`} onClick={tag.onRemove}>
            ×
          </button>
        </span>
      ))}
      {onClearAll ? (
        <button className={styles.clear} type="button" onClick={onClearAll}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
