import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TicketsListPage } from "./TicketsListPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { ticketService } from "../../services/ticketService";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { Ticket } from "../../types/ticket";
import type { SafeUser, User } from "../../types/user";

vi.mock("../../services/ticketService", () => ({
  ticketService: { list: vi.fn() },
}));
vi.mock("../../services/departmentService", () => ({
  departmentService: { list: vi.fn() },
}));
vi.mock("../../services/userService", () => ({
  userService: { list: vi.fn() },
}));

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
      <MemoryRouter initialEntries={["/tickets"]}>
        <Routes>
          <Route path="/tickets" element={<TicketsListPage />} />
          <Route path="/tickets/new" element={<div>New ticket page</div>} />
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

// TicketTable renders both a desktop table row and a mobile card for every
// ticket (visibility is CSS-only), so each title appears twice in the DOM.
async function findTicketTitles(title: string) {
  return screen.findAllByText(title);
}

describe("TicketsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment()],
    });
    vi.mocked(userService.list).mockResolvedValue({ message: "ok", users: [] });
    vi.mocked(ticketService.list).mockResolvedValue({ message: "ok", tickets: [makeTicket()] });
  });

  it("shows a spinner while tickets are loading", async () => {
    const deferred = createDeferred<{ message: string; tickets: Ticket[] }>();
    vi.mocked(ticketService.list).mockReturnValue(deferred.promise);

    renderPage(makeUser());

    expect(screen.getByRole("status")).toBeInTheDocument();

    deferred.resolve({ message: "ok", tickets: [] });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("loads tickets and departments on mount with the default query, but does not fetch users for a regular user", async () => {
    renderPage(makeUser({ role: "user" }));

    await findTicketTitles("Printer is on fire");

    expect(ticketService.list).toHaveBeenCalledWith({
      title: undefined,
      status: undefined,
      priority: undefined,
      departmentId: undefined,
      assignedToId: undefined,
      createdById: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(departmentService.list).toHaveBeenCalledTimes(1);
    expect(userService.list).not.toHaveBeenCalled();
  });

  it("fetches users for an admin so assignee/creator filters can be populated", async () => {
    renderPage(makeUser({ role: "admin" }));

    await findTicketTitles("Printer is on fire");
    expect(userService.list).toHaveBeenCalledTimes(1);
  });

  it("renders tickets returned by the service", async () => {
    vi.mocked(ticketService.list).mockResolvedValue({
      message: "ok",
      tickets: [makeTicket({ ticketId: "t-1", title: "First ticket" }), makeTicket({ ticketId: "t-2", title: "Second ticket" })],
    });

    renderPage(makeUser());

    expect((await findTicketTitles("First ticket")).length).toBeGreaterThan(0);
    expect((await findTicketTitles("Second ticket")).length).toBeGreaterThan(0);
  });

  it("shows an empty state with a 'new ticket' action when there are no tickets and no active filters", async () => {
    vi.mocked(ticketService.list).mockResolvedValue({ message: "ok", tickets: [] });

    renderPage(makeUser());

    expect(await screen.findByText("No tickets found")).toBeInTheDocument();
    expect(screen.getByText("Create your first ticket to get started.")).toBeInTheDocument();
    // The page header also has a "New ticket" link, so there are two.
    const newTicketLinks = screen.getAllByRole("link", { name: "New ticket" });
    expect(newTicketLinks).toHaveLength(2);
    newTicketLinks.forEach((link) => expect(link).toHaveAttribute("href", "/tickets/new"));
  });

  it("shows an error state with a working retry button", async () => {
    vi.mocked(ticketService.list).mockRejectedValue(new ApiError(500, "Server exploded"));

    const user = userEvent.setup();
    renderPage(makeUser());

    expect(await screen.findByRole("alert")).toHaveTextContent("Server exploded");
    expect(ticketService.list).toHaveBeenCalledTimes(1);

    vi.mocked(ticketService.list).mockResolvedValue({ message: "ok", tickets: [makeTicket()] });
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(async () => expect(await findTicketTitles("Printer is on fire")).not.toHaveLength(0));
  });

  it("toggles the filters panel open and closed", async () => {
    const user = userEvent.setup();
    renderPage(makeUser());
    await findTicketTitles("Printer is on fire");

    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByLabelText("Status")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide filters" }));
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
  });

  it("only shows assignee/creator filters to admins and super admins", async () => {
    const user = userEvent.setup();
    renderPage(makeUser({ role: "user" }));
    await findTicketTitles("Printer is on fire");
    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.queryByLabelText("Assignee")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Creator")).not.toBeInTheDocument();
  });

  it("shows assignee/creator filters for an admin", async () => {
    const user = userEvent.setup();
    renderPage(makeUser({ role: "admin" }));
    await findTicketTitles("Printer is on fire");
    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByLabelText("Assignee")).toBeInTheDocument();
    expect(screen.getByLabelText("Creator")).toBeInTheDocument();
  });

  it("refetches tickets with the selected status when a filter changes", async () => {
    const user = userEvent.setup();
    renderPage(makeUser());
    await findTicketTitles("Printer is on fire");

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.selectOptions(screen.getByLabelText("Status"), "closed");

    await waitFor(() =>
      expect(ticketService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "closed" }),
      ),
    );
  });

  it("debounces the title filter before refetching", async () => {
    const user = userEvent.setup();
    renderPage(makeUser());
    await findTicketTitles("Printer is on fire");

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.type(screen.getByLabelText("Title"), "printer");

    await waitFor(
      () =>
        expect(ticketService.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ title: "printer" }),
        ),
      { timeout: 2000 },
    );
  });

  it("enables the reset button once a filter is active, and resets on click", async () => {
    const user = userEvent.setup();
    renderPage(makeUser());
    await findTicketTitles("Printer is on fire");

    await user.click(screen.getByRole("button", { name: "Filters" }));
    const resetButton = screen.getByRole("button", { name: "Reset filters" });
    expect(resetButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    expect(resetButton).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Hide filters" }));
    expect(screen.getByRole("button", { name: "Filters (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filters (1)" }));
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    await waitFor(() => expect(screen.getByLabelText("Priority")).toHaveValue(""));
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeDisabled();
  });

  it("shows a 'reset filters' empty state when filters are active and no tickets match", async () => {
    const user = userEvent.setup();
    renderPage(makeUser());
    await findTicketTitles("Printer is on fire");

    await user.click(screen.getByRole("button", { name: "Filters" }));
    vi.mocked(ticketService.list).mockResolvedValue({ message: "ok", tickets: [] });
    await user.selectOptions(screen.getByLabelText("Priority"), "high");

    const emptyState = await screen.findByText("No tickets found");
    const container = emptyState.closest("div") as HTMLElement;
    expect(within(container).getByText("Try adjusting or resetting your filters.")).toBeInTheDocument();

    vi.mocked(ticketService.list).mockResolvedValue({ message: "ok", tickets: [makeTicket()] });
    await user.click(within(container).getByRole("button", { name: "Reset filters" }));

    await waitFor(async () => expect(await findTicketTitles("Printer is on fire")).not.toHaveLength(0));
  });
});
