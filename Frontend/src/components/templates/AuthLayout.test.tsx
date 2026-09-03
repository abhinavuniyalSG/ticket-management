import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the brand name", () => {
    render(
      <AuthLayout title="Sign in">
        <p>Form goes here</p>
      </AuthLayout>,
    );
    expect(screen.getByText("TicketDesk")).toBeInTheDocument();
  });

  it("renders the title as a heading", () => {
    render(
      <AuthLayout title="Sign in">
        <p>Form goes here</p>
      </AuthLayout>,
    );
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("does not render a description when none is given", () => {
    render(
      <AuthLayout title="Sign in">
        <p>Form goes here</p>
      </AuthLayout>,
    );
    expect(screen.queryByText(/enter your details/i)).not.toBeInTheDocument();
  });

  it("renders the description when given", () => {
    render(
      <AuthLayout title="Sign in" description="Enter your details to continue.">
        <p>Form goes here</p>
      </AuthLayout>,
    );
    expect(screen.getByText("Enter your details to continue.")).toBeInTheDocument();
  });

  it("renders its children", () => {
    render(
      <AuthLayout title="Sign in">
        <p>Form goes here</p>
      </AuthLayout>,
    );
    expect(screen.getByText("Form goes here")).toBeInTheDocument();
  });
});
