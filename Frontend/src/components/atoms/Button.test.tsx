import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Save ticket</Button>);
    expect(screen.getByRole("button", { name: "Save ticket" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save ticket</Button>);

    await user.click(screen.getByRole("button", { name: "Save ticket" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save ticket
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Save ticket" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("disables the button and marks it busy while loading", () => {
    render(<Button isLoading>Save ticket</Button>);
    // The loading spinner adds its own "Loading" text to the accessible
    // name, so match on the button role alone instead of the full name.
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
