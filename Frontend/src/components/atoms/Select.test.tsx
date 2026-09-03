import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

describe("Select", () => {
  it("renders an option for each item", () => {
    render(<Select options={OPTIONS} aria-label="Status" />);
    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Closed" })).toBeInTheDocument();
  });

  it("renders a placeholder option when provided", () => {
    render(<Select options={OPTIONS} placeholder="All statuses" aria-label="Status" />);
    expect(screen.getByRole("option", { name: "All statuses" })).toBeInTheDocument();
  });

  it("omits the placeholder option when not provided", () => {
    render(<Select options={OPTIONS} aria-label="Status" />);
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onChange when a new option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={OPTIONS} aria-label="Status" onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "closed");

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("marks itself invalid when the invalid prop is set", () => {
    render(<Select options={OPTIONS} aria-label="Status" invalid />);
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
