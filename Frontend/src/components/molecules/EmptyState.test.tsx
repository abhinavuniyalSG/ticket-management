import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No tickets found" />);
    expect(screen.getByText("No tickets found")).toBeInTheDocument();
  });

  it("does not render a description when none is given", () => {
    render(<EmptyState title="No tickets found" />);
    expect(screen.queryByText(/try adjusting/i)).not.toBeInTheDocument();
  });

  it("renders the description when given", () => {
    render(<EmptyState title="No tickets found" description="Try adjusting your filters." />);
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("renders the action node when given", () => {
    render(<EmptyState title="No tickets found" action={<button>Create ticket</button>} />);
    expect(screen.getByRole("button", { name: "Create ticket" })).toBeInTheDocument();
  });

  it("does not render an action when none is given", () => {
    render(<EmptyState title="No tickets found" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
