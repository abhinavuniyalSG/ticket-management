import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditTicketPage } from "./EditTicketPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { ticketService } from "../../services/ticketService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { Ticket } from "../../types/ticket";
import type { SafeUser, User } from "../../types/user";

vi.mock("../../services/ticketService", () => ({
  ticketService: { getById: vi.fn(), update: vi.fn() },
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

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const creator = makeUser({ id: "creator-1" });
  return {
    ticketId: "ticket-1",
    title: "Printer is on fire",
    description: "Smoke coming from the third floor printer.",
    status: "open",
    priority: "medium",
    departmentId: "dept-1",
    department: makeDepartment(),
    assignedToId: null,
    assignedTo: null,
    createdById: creator.id,
    createdBy: creator,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}

function renderPage(user: SafeUser, id = "ticket-1") {
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
      <MemoryRouter initialEntries={[`/tickets/${id}/edit`]}>
        <Routes>
          <Route path="/tickets" element={<div>Tickets list</div>} />
          <Route path="/tickets/:id/edit" element={<EditTicketPage />} />
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

describe("EditTicketPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a spinner while the ticket is loading", async () => {
    const deferred = createDeferred<{ message: string; ticket: Ticket }>();
    vi.mocked(ticketService.getById).mockReturnValue(deferred.promise);

    renderPage(makeUser({ id: "creator-1" }));

    expect(screen.getByRole("status")).toBeInTheDocument();

    deferred.resolve({ message: "ok", ticket: makeTicket() });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("fetches the ticket by the id route param", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({ message: "ok", ticket: makeTicket() });

    renderPage(makeUser({ id: "creator-1" }), "ticket-42");

    await screen.findByLabelText(/^Title/);
    expect(ticketService.getById).toHaveBeenCalledWith("ticket-42");
  });

  it("shows an error state when the ticket fails to load", async () => {
    vi.mocked(ticketService.getById).mockRejectedValue(new ApiError(500, "Server exploded"));

    renderPage(makeUser({ id: "creator-1" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server exploded");
  });

  it("blocks editing for a viewer who is not the creator", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });

    renderPage(makeUser({ id: "someone-else", role: "super_admin" }));

    expect(await screen.findByText("You can't edit this ticket")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title/)).not.toBeInTheDocument();
  });

  it("blocks editing once the ticket has moved past open", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "assigned" }),
    });

    renderPage(makeUser({ id: "creator-1" }));

    expect(await screen.findByText("You can't edit this ticket")).toBeInTheDocument();
  });

  it("pre-fills the form with the ticket's current values for the creator on an open ticket", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({
        createdById: "creator-1",
        status: "open",
        title: "Printer is on fire",
        description: "Smoke coming from the third floor printer.",
        priority: "high",
        department: makeDepartment({ departmentName: "Facilities" }),
      }),
    });

    renderPage(makeUser({ id: "creator-1" }));

    expect(await screen.findByLabelText(/^Title/)).toHaveValue("Printer is on fire");
    expect(screen.getByLabelText(/^Description/)).toHaveValue(
      "Smoke coming from the third floor printer.",
    );
    expect(screen.getByLabelText("Priority")).toHaveValue("high");
    expect(screen.getByLabelText(/^Department/)).toHaveValue("Facilities");
    expect(screen.getByLabelText(/^Department/)).toBeDisabled();
  });

  it("submits the trimmed updates and navigates back to the ticket details page", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });
    vi.mocked(ticketService.update).mockResolvedValue({
      message: "Ticket updated",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });

    const user = userEvent.setup();
    renderPage(makeUser({ id: "creator-1" }));

    const titleInput = await screen.findByLabelText(/^Title/);
    await user.clear(titleInput);
    await user.type(titleInput, "  Printer is now fixed  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(ticketService.update).toHaveBeenCalledWith("ticket-1", {
        title: "Printer is now fixed",
        description: "Smoke coming from the third floor printer.",
        priority: "medium",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Ticket updated");
    expect(mockNavigate).toHaveBeenCalledWith("/tickets/ticket-1", { replace: true });
  });

  it("shows an error toast and does not navigate when the update fails", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });
    vi.mocked(ticketService.update).mockRejectedValue(new ApiError(400, "Title is too short"));

    const user = userEvent.setup();
    renderPage(makeUser({ id: "creator-1" }));

    await screen.findByLabelText(/^Title/);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Title is too short"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
