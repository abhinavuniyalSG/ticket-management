export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fullName(
  person: { firstName: string; lastName: string } | null | undefined,
): string {
  if (!person) return "Unassigned";
  return `${person.firstName} ${person.lastName}`.trim();
}

export function initials(
  person: { firstName: string; lastName: string } | null | undefined,
): string {
  if (!person) return "?";
  const first = person.firstName.charAt(0);
  const last = person.lastName.charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}
