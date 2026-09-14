export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // Built manually rather than via Intl/toLocaleString: en-GB's "numeric"
  // day/month skeleton still resolves to 2-digit (zero-padded) in the
  // browser's locale data, but the wanted format is un-padded (e.g. "8/9/…").
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
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
