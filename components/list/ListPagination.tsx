"use client";

import { useState } from "react";
import { DataTableFooter, Pagination } from "@/components";

export const LIST_PAGE_SIZE = 10;

export function usePagedList<T>(items: T[], pageSize = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  if (page !== currentPage) setPage(currentPage);

  const start = items.length === 0 ? 0 : (currentPage - 1) * pageSize;
  return {
    page: currentPage,
    setPage,
    pageSize,
    pageItems: items.slice(start, start + pageSize),
    count: items.length,
  };
}

export function ListPagination({
  count,
  page,
  pageSize = LIST_PAGE_SIZE,
  onPageChange,
}: {
  count: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  if (count === 0) return null;

  return (
    <DataTableFooter>
      <Pagination count={count} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </DataTableFooter>
  );
}
