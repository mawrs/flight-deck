import styles from "./FilterTags.module.css";

export type FilterTagItem = {
  id: string;
  label: string;
  details?: string[];
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
        <span className={styles.tagWrap} key={tag.id}>
          <span className={styles.tag}>
            <span className={styles.label}>{tag.label}</span>
            <button className={styles.remove} type="button" aria-label={`Remove ${tag.label}`} onClick={tag.onRemove}>
              ×
            </button>
          </span>
          {tag.details && tag.details.length > 0 ? (
            <span className={styles.details} role="tooltip">
              {tag.details.map((detail, index) => (
                <span className={styles.detail} key={`${detail}-${index}`}>
                  {detail}
                </span>
              ))}
            </span>
          ) : null}
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
