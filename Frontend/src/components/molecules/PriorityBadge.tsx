import { Badge } from "../atoms/Badge";
import type { BadgeColor } from "../atoms/Badge";
import { PRIORITY_LABELS } from "../../constants/options";
import type { TicketPriority } from "../../types/ticket";

const PRIORITY_COLORS: Record<TicketPriority, BadgeColor> = {
  low: "slate",
  medium: "blue",
  high: "amber",
  urgent: "red",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge color={PRIORITY_COLORS[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
