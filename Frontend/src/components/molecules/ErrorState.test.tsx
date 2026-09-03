import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("uses the default title when none is given", () => {
    render(<ErrorState message="Failed to load tickets." />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders a custom title when given", () => {
    render(<ErrorState title="Network error" message="Failed to load tickets." />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders the message inside an alert region", () => {
    render(<ErrorState message="Failed to load tickets." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load tickets.");
  });

  it("does not render a retry button when onRetry is not given", () => {
    render(<ErrorState message="Failed to load tickets." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Failed to load tickets." onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
