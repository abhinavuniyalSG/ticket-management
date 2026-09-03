import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders with the given placeholder", () => {
    render(<Textarea placeholder="Describe the issue" />);
    expect(screen.getByPlaceholderText("Describe the issue")).toBeInTheDocument();
  });

  it("defaults to 4 rows", () => {
    render(<Textarea placeholder="Describe the issue" />);
    expect(screen.getByPlaceholderText("Describe the issue")).toHaveAttribute("rows", "4");
  });

  it("honors a custom rows value", () => {
    render(<Textarea placeholder="Describe the issue" rows={8} />);
    expect(screen.getByPlaceholderText("Describe the issue")).toHaveAttribute("rows", "8");
  });

  it("calls onChange as the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea placeholder="Describe the issue" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Describe the issue"), "abc");

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("marks itself invalid when the invalid prop is set", () => {
    render(<Textarea placeholder="Describe the issue" invalid />);
    const textarea = screen.getByPlaceholderText("Describe the issue");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveClass("border-red-400");
  });
});
