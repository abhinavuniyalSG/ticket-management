import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TicketDetailsPage } from "./TicketDetailsPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { ticketService } from "../../services/ticketService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { Ticket } from "../../types/ticket";
import type { SafeUser, User } from "../../types/user";

vi.mock("../../services/ticketService", () => ({
  ticketService: { getById: vi.fn(), update: vi.fn(), remove: vi.fn() },
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
      <MemoryRouter initialEntries={[`/tickets/${id}`]}>
        <Routes>
          <Route path="/tickets" element={<div>Tickets list</div>} />
          <Route path="/tickets/:id" element={<TicketDetailsPage />} />
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

describe("TicketDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.list).mockResolvedValue({ message: "ok", users: [] });
  });

  it("shows a spinner while the ticket is loading", async () => {
    const deferred = createDeferred<{ message: string; ticket: Ticket }>();
    vi.mocked(ticketService.getById).mockReturnValue(deferred.promise);

    renderPage(makeUser());

    expect(screen.getByRole("status")).toBeInTheDocument();

    deferred.resolve({ message: "ok", ticket: makeTicket() });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("navigates back to the tickets list via the back link", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({ message: "ok", ticket: makeTicket() });
    const user = userEvent.setup();
    renderPage(makeUser());

    await screen.findByText("Printer is on fire");
    await user.click(screen.getByRole("link", { name: "Back to tickets" }));

    expect(await screen.findByText("Tickets list")).toBeInTheDocument();
  });

  it("fetches the ticket by the id route param", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({ message: "ok", ticket: makeTicket() });

    renderPage(makeUser(), "ticket-42");

    await screen.findByText("Printer is on fire");
    expect(ticketService.getById).toHaveBeenCalledWith("ticket-42");
  });

  it("shows 'Ticket not found' for a 404 error", async () => {
    vi.mocked(ticketService.getById).mockRejectedValue(new ApiError(404, "No such ticket"));

    renderPage(makeUser());

    expect(await screen.findByText("Ticket not found")).toBeInTheDocument();
    expect(screen.getByText("No such ticket")).toBeInTheDocument();
  });

  it("shows a generic error with retry for a non-404 failure", async () => {
    vi.mocked(ticketService.getById).mockRejectedValue(new ApiError(500, "Server exploded"));

    const user = userEvent.setup();
    renderPage(makeUser());

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(ticketService.getById).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(ticketService.getById).toHaveBeenCalledTimes(2));
  });

  it("renders the ticket's status, priority and description", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "in_progress", priority: "urgent" }),
    });

    renderPage(makeUser());

    await screen.findByText("Printer is on fire");
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Smoke coming from the third floor printer.")).toBeInTheDocument();
  });

  it("shows an Edit link only when the viewer can edit the ticket content", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });

    renderPage(makeUser({ id: "creator-1" }));

    await screen.findByText("Printer is on fire");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/tickets/ticket-1/edit",
    );
  });

  it("hides the Edit link for a viewer who is not the creator", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open" }),
    });

    renderPage(makeUser({ id: "someone-else" }));

    await screen.findByText("Printer is on fire");
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("shows a Delete button only when the viewer can delete the ticket", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "in_progress", assignedToId: "someone" }),
    });

    renderPage(makeUser({ role: "super_admin" }));

    await screen.findByText("Printer is on fire");
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides the Delete button for a viewer who cannot delete the ticket", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ createdById: "creator-1", status: "open", assignedToId: "someone" }),
    });

    renderPage(makeUser({ id: "creator-1" }));

    await screen.findByText("Printer is on fire");
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("deletes the ticket after confirming and navigates back to the list", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "in_progress", assignedToId: "someone" }),
    });
    vi.mocked(ticketService.remove).mockResolvedValue({ message: "Ticket deleted" });

    const user = userEvent.setup();
    renderPage(makeUser({ role: "super_admin" }));

    await screen.findByText("Printer is on fire");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete ticket" }));

    await waitFor(() => expect(ticketService.remove).toHaveBeenCalledWith("ticket-1"));
    expect(toast.success).toHaveBeenCalledWith("Ticket deleted");
    expect(mockNavigate).toHaveBeenCalledWith("/tickets", { replace: true });
  });

  it("shows an error toast and closes the dialog when deletion fails", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "in_progress", assignedToId: "someone" }),
    });
    vi.mocked(ticketService.remove).mockRejectedValue(new ApiError(500, "Delete failed"));

    const user = userEvent.setup();
    renderPage(makeUser({ role: "super_admin" }));

    await screen.findByText("Printer is on fire");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete ticket" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Delete failed"));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows allowed status actions and updates the ticket status on click", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "assigned", assignedToId: "assignee-1" }),
    });
    vi.mocked(ticketService.update).mockResolvedValue({
      message: "Status updated",
      ticket: makeTicket({ status: "in_progress", assignedToId: "assignee-1" }),
    });

    const user = userEvent.setup();
    renderPage(makeUser({ id: "assignee-1" }));

    await screen.findByText("Printer is on fire");
    await user.click(screen.getByRole("button", { name: "Start progress" }));

    await waitFor(() =>
      expect(ticketService.update).toHaveBeenCalledWith("ticket-1", { status: "in_progress" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Status updated");
    expect(await screen.findByText("In Progress")).toBeInTheDocument();
  });

  it("does not show the actions section for a viewer with no available actions", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ status: "assigned", assignedToId: "assignee-1" }),
    });

    renderPage(makeUser({ id: "bystander" }));

    await screen.findByText("Printer is on fire");
    expect(screen.queryByRole("heading", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("lets a same-department admin assign the ticket, then unassign it", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ departmentId: "dept-1", assignedToId: null }),
    });
    vi.mocked(userService.list).mockResolvedValue({
      message: "ok",
      users: [makeUser({ id: "member-1", firstName: "Sam", lastName: "Lee", departmentId: "dept-1" })],
    });
    vi.mocked(ticketService.update).mockResolvedValueOnce({
      message: "Ticket assigned",
      ticket: makeTicket({ departmentId: "dept-1", assignedToId: "member-1" }),
    });

    const user = userEvent.setup();
    renderPage(makeUser({ role: "admin", departmentId: "dept-1" }));

    await screen.findByText("Printer is on fire");
    const assigneeSelect = await screen.findByLabelText("Select assignee");
    await user.selectOptions(assigneeSelect, "member-1");
    await user.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() =>
      expect(ticketService.update).toHaveBeenCalledWith("ticket-1", { assignedToId: "member-1" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Ticket assigned");

    const unassignButton = await screen.findByRole("button", { name: "Unassign" });
    vi.mocked(ticketService.update).mockResolvedValueOnce({
      message: "Ticket unassigned",
      ticket: makeTicket({ departmentId: "dept-1", assignedToId: null }),
    });
    await user.click(unassignButton);

    await waitFor(() =>
      expect(ticketService.update).toHaveBeenCalledWith("ticket-1", { assignedToId: null }),
    );
    expect(toast.success).toHaveBeenCalledWith("Ticket unassigned");
  });

  it("does not show the assignment section for a viewer without assignment permission", async () => {
    vi.mocked(ticketService.getById).mockResolvedValue({
      message: "ok",
      ticket: makeTicket({ departmentId: "dept-1" }),
    });

    renderPage(makeUser({ role: "user", departmentId: "dept-1" }));

    await screen.findByText("Printer is on fire");
    expect(screen.queryByText("Assignment")).not.toBeInTheDocument();
    expect(userService.list).not.toHaveBeenCalled();
  });
});
