import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import { STATUS_LABELS } from "../../constants/options";
import type { TicketStatus } from "../../types/ticket";

const ALL_STATUSES: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "reviewed",
  "completed",
  "closed",
];

describe("StatusBadge", () => {
  it.each(ALL_STATUSES)("shows the human-readable label for '%s'", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
  });
});
