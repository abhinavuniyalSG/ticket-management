import { PASSWORD_REQUIREMENTS } from "../../utils/validation";

interface PasswordRequirementsChecklistProps {
  password: string;
  id?: string;
}

/** Live-updating checklist shown under a new-password field, instead of waiting for submit. */
export function PasswordRequirementsChecklist({ password, id }: PasswordRequirementsChecklistProps) {
  return (
    <ul id={id} aria-live="polite" className="flex flex-col gap-1">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        return (
          <li
            key={requirement.id}
            className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600" : "text-slate-500"}`}
          >
            <span aria-hidden="true">{met ? "✓" : "○"}</span>
            <span>{requirement.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
