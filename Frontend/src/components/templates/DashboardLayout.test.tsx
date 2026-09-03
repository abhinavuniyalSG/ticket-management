import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardLayout } from "./DashboardLayout";

// Sidebar and MobileNavigation are organisms covered by their own test suites;
// stub them so this stays a light smoke test of the layout's own chrome.
vi.mock("../organisms/Sidebar", () => ({
  Sidebar: () => <nav data-mock="sidebar">Sidebar</nav>,
}));
vi.mock("../organisms/MobileNavigation", () => ({
  MobileNavigation: ({ isOpen }: { isOpen: boolean }) => (
    <div data-mock="mobile-nav">{isOpen ? "open" : "closed"}</div>
  ),
}));

describe("DashboardLayout", () => {
  it("renders its children", () => {
    render(
      <DashboardLayout>
        <p>Page content</p>
      </DashboardLayout>,
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders the sidebar and mobile navigation", () => {
    render(
      <DashboardLayout>
        <p>Page content</p>
      </DashboardLayout>,
    );
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("renders the mobile header with the brand name", () => {
    render(
      <DashboardLayout>
        <p>Page content</p>
      </DashboardLayout>,
    );
    expect(screen.getByText("TicketDesk")).toBeInTheDocument();
  });

  it("opens the mobile navigation when the open button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DashboardLayout>
        <p>Page content</p>
      </DashboardLayout>,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
