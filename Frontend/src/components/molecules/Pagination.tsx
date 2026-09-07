import { Button } from "../atoms/Button";
import type { PaginationMeta } from "../../types/api";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  pagination,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } =
    pagination;

  if (totalItems === 0) return null;

  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{rangeStart}</span>
        {"–"}
        <span className="font-medium text-slate-700">{rangeEnd}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={!hasPrevPage || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={!hasNextPage || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
