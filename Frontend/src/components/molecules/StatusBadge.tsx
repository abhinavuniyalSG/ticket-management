import { Badge } from "../atoms/Badge";
import type { BadgeColor } from "../atoms/Badge";
import { STATUS_LABELS } from "../../constants/options";
import type { TicketStatus } from "../../types/ticket";

const STATUS_COLORS: Record<TicketStatus, BadgeColor> = {
  open: "slate",
  assigned: "blue",
  in_progress: "amber",
  reviewed: "purple",
  completed: "green",
  closed: "gray",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>;
}
