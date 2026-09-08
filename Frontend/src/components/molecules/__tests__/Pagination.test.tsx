import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../Pagination";
import type { PaginationMeta } from "../../../types/api";

function makePagination(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    limit: 20,
    totalItems: 45,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false,
    ...overrides,
  };
}

describe("Pagination", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(
      <Pagination
        pagination={makePagination({ totalItems: 0, totalPages: 0 })}
        onPageChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current range and page position", () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
    expect(screen.getByText("Showing", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("45", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    const { rerender } = render(
      <Pagination pagination={makePagination({ page: 1, hasPrevPage: false })} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    rerender(
      <Pagination
        pagination={makePagination({ page: 3, hasNextPage: false, hasPrevPage: true })}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("calls onPageChange with the next/previous page number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={makePagination({ page: 2, hasPrevPage: true, hasNextPage: true })}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("disables both buttons while loading", () => {
    render(
      <Pagination
        pagination={makePagination({ page: 2, hasPrevPage: true, hasNextPage: true })}
        onPageChange={vi.fn()}
        isLoading
      />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
