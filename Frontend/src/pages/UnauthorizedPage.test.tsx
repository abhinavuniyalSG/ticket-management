import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UnauthorizedPage } from "./UnauthorizedPage";

describe("UnauthorizedPage", () => {
  it("shows the access-denied message", () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("You don't have access to this page")).toBeInTheDocument();
    expect(
      screen.getByText("Your account role doesn't have permission to view this section."),
    ).toBeInTheDocument();
  });

  it("links back home", () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/");
  });
});
