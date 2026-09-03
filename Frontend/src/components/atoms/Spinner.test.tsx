import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renders a status element labelled 'Loading' by default", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    render(<Spinner label="Fetching tickets" />);
    expect(screen.getByRole("status", { name: "Fetching tickets" })).toBeInTheDocument();
  });

  it("applies the size classes for the requested size", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("h-10", "w-10");
  });

  it("defaults to the medium size", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveClass("h-6", "w-6");
  });
});
