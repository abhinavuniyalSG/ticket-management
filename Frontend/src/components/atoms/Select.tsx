import ReactSelect from "react-select";
import type { StylesConfig } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function Select({
  options,
  placeholder,
  invalid = false,
  value,
  onChange,
  disabled = false,
  className = "",
  id,
  name,
  ...rest
}: SelectProps) {
  const selected = options.find((option) => option.value === value) ?? null;

  const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.25rem",
      borderRadius: "0.5rem",
      borderColor: invalid ? "#f87171" : state.isFocused ? "#6366f1" : "#cbd5e1",
      boxShadow: state.isFocused
        ? "0 0 0 3px rgba(99,102,241,0.25)"
        : "0 1px 2px rgba(15,23,42,0.04)",
      transition: "box-shadow 150ms ease, border-color 150ms ease",
      "&:hover": { borderColor: invalid ? "#f87171" : state.isFocused ? "#6366f1" : "#94a3b8" },
      fontSize: "0.875rem",
      backgroundColor: disabled ? "#f1f5f9" : "white",
      cursor: "pointer",
    }),
    valueContainer: (base) => ({ ...base, padding: "0 0.5rem" }),
    singleValue: (base) => ({ ...base, color: "#475569" }),
    placeholder: (base) => ({ ...base, color: "#94a3b8" }),
    input: (base) => ({ ...base, color: "#334155" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: "#94a3b8",
      padding: "0 0.5rem",
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
    }),
    clearIndicator: (base) => ({ ...base, color: "#94a3b8", cursor: "pointer" }),
    menu: (base) => ({
      ...base,
      zIndex: 20,
      fontSize: "0.875rem",
      borderRadius: "0.625rem",
      overflow: "hidden",
      boxShadow: "0 8px 24px -6px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.08)",
    }),
    option: (base, state) => ({
      ...base,
      cursor: "pointer",
      backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#eef2ff" : "white",
      color: state.isSelected ? "white" : "#1e293b",
      transition: "background-color 100ms ease",
    }),
  };

  return (
    <ReactSelect<SelectOption, false>
      inputId={id}
      name={name}
      classNamePrefix="rs"
      className={className}
      options={options}
      value={selected}
      onChange={(option) => onChange?.({ target: { value: option?.value ?? "" } })}
      placeholder={placeholder ?? ""}
      isDisabled={disabled}
      isClearable={Boolean(placeholder) && selected !== null}
      isSearchable
      styles={styles}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
