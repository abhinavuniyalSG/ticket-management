import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with the given placeholder", () => {
    render(<Input placeholder="Search tickets" />);
    expect(screen.getByPlaceholderText("Search tickets")).toBeInTheDocument();
  });

  it("calls onChange as the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="Search tickets" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Search tickets"), "abc");

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Input placeholder="Search tickets" disabled />);
    expect(screen.getByPlaceholderText("Search tickets")).toBeDisabled();
  });

  it("marks itself invalid when the invalid prop is set", () => {
    render(<Input placeholder="Search tickets" invalid />);
    const input = screen.getByPlaceholderText("Search tickets");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-red-400");
  });

  it("is not marked invalid by default", () => {
    render(<Input placeholder="Search tickets" />);
    const input = screen.getByPlaceholderText("Search tickets");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveClass("border-slate-300");
  });
});
