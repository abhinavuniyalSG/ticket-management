import ReactSelect, { components as reactSelectComponents } from "react-select";
import type {
  AriaLiveMessages,
  ClearIndicatorProps,
  DropdownIndicatorProps,
  GroupBase,
  StylesConfig,
} from "react-select";

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
  /** Renders the selected value in the same muted grey as the placeholder text,
   * for fields (like a "Sort by") that always have a value rather than a
   * meaningful "unset" state, so they read consistently with fields next to
   * them that are still on their placeholder. */
  muted?: boolean;
}

/**
 * react-select's own default onFocus/onFilter/guidance messages are rendered
 * as adjacent screen-reader-only text nodes with no separating space, so
 * "Engineering, 1 of 4." runs straight into "4 results available." and gets
 * announced as "Engineering, 1 of 4.4 results available." (worse still, the
 * "1 of N" part is only included at all on Apple platforms). Overriding
 * onFocus and onFilter to end with a space keeps the messages distinct and
 * makes the option count consistent across platforms.
 */
const ariaLiveMessages: AriaLiveMessages<SelectOption, false, GroupBase<SelectOption>> = {
  onFocus: ({ focused, label, options }) => {
    const flatOptions = options as SelectOption[];
    const position = flatOptions.length
      ? `, ${flatOptions.indexOf(focused as SelectOption) + 1} of ${flatOptions.length}`
      : "";
    return `${label}${position}. `;
  },
  onFilter: ({ inputValue, resultsMessage }) =>
    `${resultsMessage}${inputValue ? ` for search term ${inputValue}` : ""}. `,
};

/**
 * react-select's built-in chevron is a solid filled shape, which reads as
 * much bolder than the thin-stroke icons used everywhere else in the app.
 * Swap it for a matching thin-stroke chevron so it's visually consistent.
 */
function DropdownIndicator(props: DropdownIndicatorProps<SelectOption, false>) {
  return (
    <reactSelectComponents.DropdownIndicator {...props}>
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M5.5 8l4.5 4.5 4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </reactSelectComponents.DropdownIndicator>
  );
}

/**
 * react-select's built-in clear "x" is the same kind of solid filled shape
 * as its chevron, so it gets the same thin-stroke treatment for consistency.
 */
function ClearIndicator(props: ClearIndicatorProps<SelectOption, false>) {
  return (
    <reactSelectComponents.ClearIndicator {...props}>
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M6 6l8 8M14 6l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </reactSelectComponents.ClearIndicator>
  );
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
  muted = false,
  ...rest
}: SelectProps) {
  const selected = options.find((option) => option.value === value) ?? null;

  const styles: StylesConfig<SelectOption, false> = {
    // Without this, the control's automatic flex min-size stays pinned to
    // its content width, so it never actually shrinks small enough for the
    // singleValue/placeholder ellipsis below to kick in inside a tight flex
    // row (e.g. the Users page filter bar at in-between viewport widths).
    container: (base) => ({ ...base, minWidth: 0 }),
    control: (base, state) => ({
      ...base,
      minHeight: "2.25rem",
      borderRadius: "0.5rem",
      borderColor: invalid ? "#f87171" : state.isFocused ? "#6366f1" : "#cbd5e1",
      boxShadow: "none",
      transition: "border-color 150ms ease",
      "&:hover": { borderColor: invalid ? "#f87171" : state.isFocused ? "#6366f1" : "#94a3b8" },
      fontSize: "0.875rem",
      backgroundColor: disabled ? "#f1f5f9" : "white",
      cursor: "pointer",
    }),
    valueContainer: (base) => ({ ...base, padding: "0 0.5rem" }),
    singleValue: (base) => ({ ...base, color: muted ? "#94a3b8" : "#475569" }),
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
      components={{ DropdownIndicator, ClearIndicator }}
      ariaLiveMessages={ariaLiveMessages}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
