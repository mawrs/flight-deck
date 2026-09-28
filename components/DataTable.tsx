import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
} from "react";
import styles from "./DataTable.module.css";

type Density = "compact" | "comfortable";

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function DataTableCard({
  children,
  className,
  rules = false,
  ...props
}: HTMLAttributes<HTMLElement> & { rules?: boolean }) {
  return (
    <section className={classes(styles.card, rules && styles.rules, className)} {...props}>
      {children}
    </section>
  );
}

export function DataTableToolbar({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classes(styles.toolbar, className)} {...props}>
      {children}
    </div>
  );
}

export function DataTableScroll({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classes(styles.scroll, className)} {...props}>
      {children}
    </div>
  );
}

export function DataTable({
  density = "comfortable",
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { density?: Density }) {
  return <table className={classes(styles.table, styles[density], className)} {...props} />;
}

export function DataTableFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classes(styles.footer, className)} {...props}>
      {children}
    </div>
  );
}

export function SortLabel({
  children,
  sortable = true,
}: {
  children: ReactNode;
  sortable?: boolean;
}) {
  return (
    <span className={styles.headerLabel}>
      {children}
      {sortable ? <img src="/dashboard/sort.svg" alt="" /> : null}
    </span>
  );
}
