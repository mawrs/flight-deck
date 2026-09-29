import styles from "./Pagination.module.css";

type PaginationProps = {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  showRange?: boolean;
  disabledPages?: readonly number[];
};

export function Pagination({
  count,
  page,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  showRange = true,
  disabledPages = [],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, count);

  const range = showRange ? (
    <span className={styles.range}>
      <strong>
        {start}-{end}
      </strong>{" "}
      of <strong>{count}</strong>
    </span>
  ) : null;
  const pageSizeControl =
    pageSizeOptions && onPageSizeChange ? (
      <label className={styles.pageSize}>
        <span>Rows per page</span>
        <select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  return (
    <>
      {pageSizeControl || range ? (
        <div className={styles.summary}>
          {pageSizeControl}
          {range}
        </div>
      ) : null}
      {totalPages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <PageButton label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            <img src="/dashboard/angle-left.svg" alt="" />
          </PageButton>
          {visiblePages(currentPage, totalPages).map((number) => (
            <PageButton
              key={number}
              label={`Page ${number}`}
              current={number === currentPage}
              disabled={disabledPages.includes(number)}
              onClick={() => onPageChange(number)}
            >
              {number}
            </PageButton>
          ))}
          <PageButton label="Next page" disabled={currentPage === totalPages || disabledPages.includes(currentPage + 1)} onClick={() => onPageChange(currentPage + 1)}>
            <img src="/dashboard/angle-right.svg" alt="" />
          </PageButton>
        </nav>
      ) : null}
    </>
  );
}

function visiblePages(current: number, total: number, maximum = 5) {
  if (total <= maximum) return Array.from({ length: total }, (_, index) => index + 1);
  const half = Math.floor(maximum / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + maximum - 1);
  start = Math.max(1, end - maximum + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function PageButton({
  children,
  label,
  current = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={current ? styles.current : styles.button}
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
