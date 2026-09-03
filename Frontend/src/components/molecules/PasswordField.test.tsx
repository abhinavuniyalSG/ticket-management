import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { PasswordField } from "./PasswordField";

function ControlledPasswordField(
  props: Partial<React.ComponentProps<typeof PasswordField>> = {},
) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <PasswordField
      label="Password"
      id="password"
      value={value}
      onChange={setValue}
      {...props}
    />
  );
}

describe("PasswordField", () => {
  it("renders as a password input by default", () => {
    render(<ControlledPasswordField />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("shows the value typed by the user", async () => {
    const user = userEvent.setup();
    render(<ControlledPasswordField />);

    await user.type(screen.getByLabelText("Password"), "secret123");

    expect(screen.getByLabelText("Password")).toHaveValue("secret123");
  });

  it("toggles the input to plain text when the show password checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<ControlledPasswordField />);

    await user.click(screen.getByLabelText("Show password"));

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("toggles back to password when the checkbox is unchecked", async () => {
    const user = userEvent.setup();
    render(<ControlledPasswordField />);

    const checkbox = screen.getByLabelText("Show password");
    await user.click(checkbox);
    await user.click(checkbox);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("does not render its own checkbox when visibility is controlled", () => {
    render(<PasswordField label="Password" id="password" value="" onChange={vi.fn()} isVisible />);
    expect(screen.queryByLabelText("Show password")).not.toBeInTheDocument();
  });

  it("uses the controlled isVisible prop to decide the input type", () => {
    render(<PasswordField label="Password" id="password" value="" onChange={vi.fn()} isVisible />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("shows the field error", () => {
    render(
      <PasswordField label="Password" id="password" value="" onChange={vi.fn()} error="Too weak" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Too weak");
  });
});
