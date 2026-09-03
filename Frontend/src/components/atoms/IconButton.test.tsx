import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("uses the label as the accessible name and title", () => {
    render(<IconButton icon={<span>x</span>} label="Delete ticket" />);
    const button = screen.getByRole("button", { name: "Delete ticket" });
    expect(button).toHaveAttribute("title", "Delete ticket");
  });

  it("renders the provided icon", () => {
    render(<IconButton icon={<span data-testid="icon">x</span>} label="Delete ticket" />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={<span>x</span>} label="Delete ticket" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Delete ticket" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={<span>x</span>} label="Delete ticket" onClick={onClick} disabled />);

    await user.click(screen.getByRole("button", { name: "Delete ticket" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies danger variant classes", () => {
    render(<IconButton icon={<span>x</span>} label="Delete ticket" variant="danger" />);
    expect(screen.getByRole("button", { name: "Delete ticket" })).toHaveClass("text-red-600");
  });
});
