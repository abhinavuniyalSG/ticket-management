import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("renders the label associated with its input", () => {
    render(
      <FormField label="Title" htmlFor="title">
        <input id="title" />
      </FormField>,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("does not show a required marker by default", () => {
    render(
      <FormField label="Title" htmlFor="title">
        <input id="title" />
      </FormField>,
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows a required marker when required", () => {
    render(
      <FormField label="Title" htmlFor="title" required>
        <input id="title" />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows a hint when there is no error", () => {
    render(
      <FormField label="Title" htmlFor="title" hint="Keep it short.">
        <input id="title" />
      </FormField>,
    );
    expect(screen.getByText("Keep it short.")).toBeInTheDocument();
  });

  it("shows the error instead of the hint when both are given", () => {
    render(
      <FormField label="Title" htmlFor="title" hint="Keep it short." error="Title is required">
        <input id="title" />
      </FormField>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Title is required");
    expect(screen.queryByText("Keep it short.")).not.toBeInTheDocument();
  });
});
