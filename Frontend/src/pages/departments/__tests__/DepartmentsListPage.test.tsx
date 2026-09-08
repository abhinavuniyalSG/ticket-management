import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { DepartmentsListPage } from "../DepartmentsListPage";
import { departmentService } from "../../../services/departmentService";
import { ApiError } from "../../../types/api";
import type { Department } from "../../../types/department";
import { makePagination } from "../../../test/paginationFixture";

vi.mock("../../../services/departmentService", () => ({
  departmentService: { list: vi.fn(), remove: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockedDepartmentService = vi.mocked(departmentService);
const mockedToast = vi.mocked(toast);

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DepartmentsListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DepartmentsListPage", () => {
  it("shows a loading spinner while fetching departments", () => {
    mockedDepartmentService.list.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("loads departments on mount with the default query", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentName: "Support" })],
      pagination: makePagination({ totalItems: 1, totalPages: 1 }),
    });

    renderPage();

    await screen.findAllByRole("link", { name: "Support" });
    expect(mockedDepartmentService.list).toHaveBeenCalledWith({
      departmentName: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("shows an empty state when there are no departments", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [],
      pagination: makePagination(),
    });
    renderPage();

    expect(await screen.findByText("No departments found")).toBeInTheDocument();
  });

  it("shows an error state and retries on click", async () => {
    mockedDepartmentService.list.mockRejectedValueOnce(new ApiError(500, "Server error"));
    mockedDepartmentService.list.mockResolvedValueOnce({
      message: "ok",
      departments: [],
      pagination: makePagination(),
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No departments found")).toBeInTheDocument();
    expect(mockedDepartmentService.list).toHaveBeenCalledTimes(2);
  });

  it("refetches with the trimmed search text after debouncing", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [],
      pagination: makePagination(),
    });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockedDepartmentService.list).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Search departments"), "Sales");

    await waitFor(
      () =>
        expect(mockedDepartmentService.list).toHaveBeenLastCalledWith({
          departmentName: "Sales",
          page: 1,
          limit: 20,
        }),
      { timeout: 2000 },
    );
  });

  it("links to the create-department route instead of an inline form", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [],
      pagination: makePagination(),
    });
    renderPage();

    const link = await screen.findByRole("link", { name: "New department" });
    expect(link).toHaveAttribute("href", "/departments/new");
  });

  it("deletes a department after confirming and removes it from the list", async () => {
    const target = makeDepartment({ departmentId: "dept-2", departmentName: "Marketing" });
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [target],
      pagination: makePagination({ totalItems: 1, totalPages: 1 }),
    });
    mockedDepartmentService.remove.mockResolvedValue({ message: "Department deleted." });
    const user = userEvent.setup();
    renderPage();

    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: "Delete Marketing" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Marketing");

    await user.click(within(dialog).getByRole("button", { name: "Delete department" }));

    await waitFor(() => expect(mockedDepartmentService.remove).toHaveBeenCalledWith("dept-2"));
    expect(mockedToast.success).toHaveBeenCalledWith("Department deleted.");
    expect(screen.queryAllByRole("link", { name: "Marketing" })).toHaveLength(0);
  });

  it("shows pagination info and requests the next page on click", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentName: "Support" })],
      pagination: makePagination({ page: 1, totalItems: 25, totalPages: 2, hasNextPage: true }),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link", { name: "Support" });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() =>
      expect(mockedDepartmentService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });

  it("resets back to page 1 when the search filter changes", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentName: "Support" })],
      pagination: makePagination({ page: 1, totalItems: 25, totalPages: 2, hasNextPage: true }),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link", { name: "Support" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(mockedDepartmentService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    await user.type(screen.getByLabelText("Search departments"), "Sales");

    await waitFor(
      () =>
        expect(mockedDepartmentService.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ departmentName: "Sales", page: 1 }),
        ),
      { timeout: 2000 },
    );
  });
});
