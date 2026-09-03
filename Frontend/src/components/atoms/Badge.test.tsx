import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Open</Badge>);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("applies the default slate color classes", () => {
    render(<Badge>Open</Badge>);
    expect(screen.getByText("Open")).toHaveClass("bg-slate-100", "text-slate-700");
  });

  it("applies the requested color classes", () => {
    render(<Badge color="red">Urgent</Badge>);
    expect(screen.getByText("Urgent")).toHaveClass("bg-red-50", "text-red-700");
  });

  it("merges a custom className", () => {
    render(<Badge className="ml-2">Open</Badge>);
    expect(screen.getByText("Open")).toHaveClass("ml-2");
  });
});
