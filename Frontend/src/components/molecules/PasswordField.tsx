import { useState } from "react";
import { FormField } from "./FormField";
import { Input } from "../atoms/Input";

interface PasswordFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  /** Controlled visibility. When provided, this field uses it instead of its own
   * checkbox, so a parent can drive several PasswordFields from one shared toggle. */
  isVisible?: boolean;
}

export function PasswordField({
  label,
  id,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  autoComplete,
  isVisible: isVisibleProp,
}: PasswordFieldProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = isVisibleProp !== undefined;
  const isVisible = isControlled ? isVisibleProp : internalVisible;
  const checkboxId = `${id}-show`;

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <div className="flex flex-col gap-1.5">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {!isControlled && (
          <label
            htmlFor={checkboxId}
            className="inline-flex select-none items-center gap-2 text-xs text-slate-600"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={internalVisible}
              onChange={(e) => setInternalVisible(e.target.checked)}
              disabled={disabled}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            Show password
          </label>
        )}
      </div>
    </FormField>
  );
}
