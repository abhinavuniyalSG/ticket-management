import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("uses 'Search' as the default accessible label", () => {
    render(<SearchInput />);
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
  });

  it("supports a custom accessible label", () => {
    render(<SearchInput label="Search tickets" />);
    expect(screen.getByLabelText("Search tickets")).toBeInTheDocument();
  });

  it("renders as a search input", () => {
    render(<SearchInput />);
    expect(screen.getByLabelText("Search")).toHaveAttribute("type", "search");
  });

  it("passes through additional input props", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput placeholder="Type to search" onChange={onChange} />);

    const input = screen.getByPlaceholderText("Type to search");
    await user.type(input, "urgent");

    expect(onChange).toHaveBeenCalled();
  });
});
