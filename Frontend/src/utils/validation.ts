export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/**
 * The rules shown live in the password requirements checklist. Kept separate
 * from the 255-char cap below since that one is a safety limit, not
 * something worth rendering as a checklist row.
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters long", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "At least one number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "At least one special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Mirrors the password rules enforced by the backend's zod schemas. */
export function getPasswordErrors(password: string): string[] {
  const errors = PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.test(password)).map(
    (requirement) => requirement.label,
  );
  if (password.length > 255) errors.push("Must not exceed 255 characters");
  return errors;
}

export function isPasswordValid(password: string): boolean {
  return password.length <= 255 && PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
