import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * react-select renders its options only while its menu is open, and matching
 * is done against the option's visible label text (not its underlying
 * value) - unlike a native <select>, which userEvent.selectOptions() could
 * drive directly by value. This opens the given combobox (found the same
 * way getByLabelText/getByRole("combobox") would resolve a native select)
 * and clicks the option with the given visible label.
 */
export async function selectReactOption(
  user: UserEvent,
  comboboxName: string | RegExp,
  optionName: string | RegExp,
) {
  await user.click(screen.getByRole("combobox", { name: comboboxName }));
  await user.click(await screen.findByRole("option", { name: optionName }));
}
