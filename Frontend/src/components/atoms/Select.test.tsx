import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

describe("Select", () => {
  it("shows every option once opened", async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} aria-label="Status" />);
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Closed" })).toBeInTheDocument();
  });

  it("shows a placeholder when a placeholder is given and nothing is selected", () => {
    render(<Select options={OPTIONS} placeholder="All statuses" aria-label="Status" />);
    expect(screen.getByText("All statuses")).toBeInTheDocument();
  });

  it("opens to exactly the given options, no extra placeholder option mixed in", async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} aria-label="Status" />);
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onChange with a native-event-shaped payload when a new option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={OPTIONS} aria-label="Status" onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Closed" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ target: { value: "closed" } });
  });

  it("shows the currently selected option's label", () => {
    render(<Select options={OPTIONS} aria-label="Status" value="closed" onChange={vi.fn()} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("marks itself invalid when the invalid prop is set", () => {
    render(<Select options={OPTIONS} aria-label="Status" invalid />);
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
