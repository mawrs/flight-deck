import styles from "./Divider.module.css";

type DividerProps = {
  orientation?: "horizontal" | "vertical";
};

export function Divider({ orientation = "horizontal" }: DividerProps) {
  return <span className={styles[orientation]} role="separator" />;
}
