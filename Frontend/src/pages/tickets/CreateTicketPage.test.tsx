import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CreateTicketPage } from "./CreateTicketPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { ticketService } from "../../services/ticketService";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { SafeUser, User } from "../../types/user";

vi.mock("../../services/ticketService", () => ({
  ticketService: { create: vi.fn() },
}));
vi.mock("../../services/departmentService", () => ({
  departmentService: { list: vi.fn() },
}));
vi.mock("../../services/userService", () => ({
  userService: { list: vi.fn() },
}));

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
import toast from "react-hot-toast";

function makeUser(overrides: Partial<User> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderPage(user: SafeUser) {
  const authValue: AuthContextValue = {
    user,
    status: "authenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/tickets/new"]}>
        <Routes>
          <Route path="/tickets/new" element={<CreateTicketPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("CreateTicketPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment()],
    });
    vi.mocked(userService.list).mockResolvedValue({ message: "ok", users: [] });
  });

  it("shows a spinner while form data is loading", async () => {
    const deferred = createDeferred<{ message: string; departments: Department[] }>();
    vi.mocked(departmentService.list).mockReturnValue(deferred.promise);

    renderPage(makeUser());

    expect(screen.getByRole("status")).toBeInTheDocument();

    deferred.resolve({ message: "ok", departments: [] });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("loads departments for a regular user without fetching assignable users", async () => {
    renderPage(makeUser({ role: "user" }));

    await screen.findByLabelText(/^Title/);

    expect(departmentService.list).toHaveBeenCalledTimes(1);
    expect(userService.list).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Assignee")).not.toBeInTheDocument();
  });

  it("loads assignable users for an admin and shows the assignee field", async () => {
    vi.mocked(userService.list).mockResolvedValue({
      message: "ok",
      users: [
        { ...makeUser({ id: "member-1", firstName: "Sam", lastName: "Lee" }), departmentId: "dept-1" },
      ],
    });

    renderPage(makeUser({ role: "admin", departmentId: "dept-1" }));

    await screen.findByLabelText(/^Title/);

    expect(userService.list).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Assignee")).toBeInTheDocument();
  });

  it("only offers assignees from the department selected in the form", async () => {
    vi.mocked(userService.list).mockResolvedValue({
      message: "ok",
      users: [
        makeUser({ id: "member-1", firstName: "Sam", lastName: "Lee", departmentId: "dept-1" }),
        makeUser({ id: "member-2", firstName: "Ann", lastName: "Kim", departmentId: "dept-2" }),
      ],
    });
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentId: "dept-1" }), makeDepartment({ departmentId: "dept-2", departmentName: "IT" })],
    });

    const user = userEvent.setup();
    renderPage(makeUser({ role: "admin" }));

    await screen.findByLabelText(/^Title/);
    await user.selectOptions(screen.getByLabelText(/^Department/), "dept-1");

    expect(screen.getByRole("option", { name: "Sam Lee" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Ann Kim" })).not.toBeInTheDocument();
  });

  it("shows an error state when loading form data fails", async () => {
    vi.mocked(departmentService.list).mockRejectedValue(new ApiError(500, "Server exploded"));

    renderPage(makeUser());

    expect(await screen.findByRole("alert")).toHaveTextContent("Server exploded");
  });

  it("shows a generic error message for a non-API error", async () => {
    vi.mocked(departmentService.list).mockRejectedValue(new Error("network down"));

    renderPage(makeUser());

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load form data.");
  });

  it("submits the trimmed form values and navigates to the created ticket", async () => {
    vi.mocked(ticketService.create).mockResolvedValue({
      message: "Ticket created",
      ticket: { ticketId: "ticket-99" } as never,
    });

    const user = userEvent.setup();
    renderPage(makeUser());

    await user.type(await screen.findByLabelText(/^Title/), "  Printer is broken  ");
    await user.type(screen.getByLabelText(/^Description/), "  It jams every time.  ");
    await user.selectOptions(screen.getByLabelText(/^Department/), "dept-1");
    await user.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() =>
      expect(ticketService.create).toHaveBeenCalledWith({
        title: "Printer is broken",
        description: "It jams every time.",
        departmentId: "dept-1",
        priority: "low",
        assignedToId: undefined,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Ticket created");
    expect(mockNavigate).toHaveBeenCalledWith("/tickets/ticket-99", { replace: true });
  });

  it("shows an error toast and does not navigate when creation fails", async () => {
    vi.mocked(ticketService.create).mockRejectedValue(new ApiError(400, "Title is required"));

    const user = userEvent.setup();
    renderPage(makeUser());

    await user.type(await screen.findByLabelText(/^Title/), "Printer is broken");
    await user.type(screen.getByLabelText(/^Description/), "It jams every time.");
    await user.selectOptions(screen.getByLabelText(/^Department/), "dept-1");
    await user.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Title is required"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
