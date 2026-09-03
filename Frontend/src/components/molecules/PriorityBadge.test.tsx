import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "./PriorityBadge";
import { PRIORITY_LABELS } from "../../constants/options";
import type { TicketPriority } from "../../types/ticket";

const ALL_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

describe("PriorityBadge", () => {
  it.each(ALL_PRIORITIES)("shows the human-readable label for '%s'", (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(PRIORITY_LABELS[priority])).toBeInTheDocument();
  });
});
