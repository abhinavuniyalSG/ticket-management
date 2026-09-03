import { test, expect } from "@playwright/test";
import { fakeDepartment, fakeTicket, fakeUser, mockLoggedIn } from "./fixtures";

// Routes are scoped to "**/api/..." rather than just "**/tickets*" etc.
// because page.goto() performs a real HTTP navigation to
// http://localhost:5173/tickets, which would otherwise also match a bare
// "**/tickets*" glob and get intercepted instead of loading the app.

const user = fakeUser({ id: "user-1", role: "user" });
const department = fakeDepartment();

test.beforeEach(async ({ page }) => {
  await mockLoggedIn(page, user);
});

test("shows the tickets a user can see in the list", async ({ page }) => {
  const tickets = [
    fakeTicket({ ticketId: "ticket-1", title: "Printer is on fire", department }),
    fakeTicket({ ticketId: "ticket-2", title: "VPN keeps dropping", department }),
  ];
  await page.route("**/api/tickets*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", tickets } }),
  );
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [department] } }),
  );

  await page.goto("/tickets");

  await expect(page.getByRole("link", { name: "Printer is on fire" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VPN keeps dropping" })).toBeVisible();
});

test("creates a ticket and lands on its details page", async ({ page }) => {
  const created = fakeTicket({
    ticketId: "new-ticket-1",
    title: "Monitor won't turn on",
    description: "The second monitor stays black after waking the machine.",
    createdById: user.id,
    createdBy: user,
    department,
  });

  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [department] } }),
  );
  await page.route("**/api/tickets", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        json: { message: "Ticket created", ticket: created },
      });
    }
    return route.fulfill({ status: 200, json: { message: "OK", tickets: [] } });
  });
  await page.route("**/api/tickets/new-ticket-1", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", ticket: created } }),
  );

  await page.goto("/tickets/new");

  await page.getByLabel("Title").fill(created.title);
  await page.getByLabel("Description").fill(created.description);
  await page.getByLabel("Department").selectOption(department.departmentId);
  await page.getByRole("button", { name: "Create ticket" }).click();

  await expect(page).toHaveURL(`/tickets/${created.ticketId}`);
  await expect(page.getByRole("heading", { name: created.title })).toBeVisible();
});

test("opens a ticket from the list and views its details", async ({ page }) => {
  const ticket = fakeTicket({
    ticketId: "ticket-view-1",
    title: "Keyboard missing keys",
    description: "Several keys have fallen off the keyboard in meeting room 2.",
    createdById: "someone-else",
    createdBy: fakeUser({ id: "someone-else", firstName: "Grace", lastName: "Hopper" }),
    department,
  });

  await page.route("**/api/tickets*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", tickets: [ticket] } }),
  );
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [department] } }),
  );
  await page.route(`**/api/tickets/${ticket.ticketId}`, (route) =>
    route.fulfill({ status: 200, json: { message: "OK", ticket } }),
  );

  await page.goto("/tickets");
  await page.getByRole("link", { name: ticket.title }).click();

  await expect(page).toHaveURL(`/tickets/${ticket.ticketId}`);
  await expect(page.getByText(ticket.description)).toBeVisible();
});

test("lets the creator edit a ticket they created while it is still open", async ({ page }) => {
  const ticket = fakeTicket({
    ticketId: "ticket-edit-1",
    title: "Chair needs replacing",
    description: "The armrest snapped off the chair at desk 12.",
    status: "open",
    createdById: user.id,
    createdBy: user,
    department,
  });
  const updated = { ...ticket, title: "Chair needs replacing urgently" };
  let currentTicket = ticket;

  await page.route(`**/api/tickets/${ticket.ticketId}`, (route) => {
    if (route.request().method() === "PATCH") {
      currentTicket = updated;
      return route.fulfill({
        status: 200,
        json: { message: "Ticket updated", ticket: currentTicket },
      });
    }
    return route.fulfill({ status: 200, json: { message: "OK", ticket: currentTicket } });
  });

  await page.goto(`/tickets/${ticket.ticketId}`);
  await page.getByRole("link", { name: "Edit" }).click();

  await expect(page).toHaveURL(`/tickets/${ticket.ticketId}/edit`);

  const titleInput = page.getByLabel("Title");
  await titleInput.fill(updated.title);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(`/tickets/${ticket.ticketId}`);
  await expect(page.getByRole("heading", { name: updated.title })).toBeVisible();
});
