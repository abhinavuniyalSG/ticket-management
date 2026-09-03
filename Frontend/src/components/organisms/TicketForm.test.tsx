import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketForm } from "./TicketForm";
import type { TicketFormValues } from "./TicketForm";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    manager: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeValues(overrides: Partial<TicketFormValues> = {}): TicketFormValues {
  return {
    title: "",
    description: "",
    departmentId: "",
    priority: "low",
    assignedToId: "",
    ...overrides,
  };
}

describe("TicketForm", () => {
  it("renders the initial values in the fields", () => {
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment()]}
        initialValues={makeValues({ title: "Existing title", description: "Existing description" })}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue("Existing title");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Existing description");
  });

  it("shows validation errors and does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment()]}
        initialValues={makeValues()}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create ticket" }));

    expect(screen.getByText("Title must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByText("Description must be at least 5 characters")).toBeInTheDocument();
    expect(screen.getByText("Please select a department")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a title over 200 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment()]}
        initialValues={makeValues({
          title: "a".repeat(201),
          description: "Valid description",
          departmentId: "dept-1",
        })}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create ticket" }));

    expect(screen.getByText("Title must not exceed 200 characters")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the entered values when the form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment({ departmentId: "dept-1" })]}
        initialValues={makeValues()}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/title/i), "Printer is broken");
    await user.type(screen.getByLabelText(/description/i), "The office printer jams constantly.");
    await user.selectOptions(screen.getByLabelText(/department/i), "dept-1");
    await user.click(screen.getByRole("button", { name: "Create ticket" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Printer is broken",
      description: "The office printer jams constantly.",
      departmentId: "dept-1",
      priority: "low",
      assignedToId: "",
    });
  });

  it("notifies onDepartmentChange and clears the assignee when the department changes", async () => {
    const user = userEvent.setup();
    const onDepartmentChange = vi.fn();
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment({ departmentId: "dept-1" })]}
        assignableUsers={[makeUser()]}
        showAssignee
        initialValues={makeValues({ assignedToId: "user-1" })}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={vi.fn()}
        onDepartmentChange={onDepartmentChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/department/i), "dept-1");

    expect(onDepartmentChange).toHaveBeenCalledWith("dept-1");
    expect(screen.getByLabelText(/assignee/i)).toHaveValue("");
  });

  it("disables the assignee field with a hint until a department is chosen", () => {
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment()]}
        assignableUsers={[makeUser()]}
        showAssignee
        initialValues={makeValues()}
        isSubmitting={false}
        submitLabel="Create ticket"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Select a department first.")).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeDisabled();
  });

  it("shows the department as read-only text in edit mode and does not require it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TicketForm
        mode="edit"
        departments={[]}
        departmentName="Support"
        initialValues={makeValues({ title: "Printer issue", description: "Still jamming." })}
        isSubmitting={false}
        submitLabel="Save changes"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByDisplayValue("Support")).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables inputs and the submit button while submitting", () => {
    render(
      <TicketForm
        mode="create"
        departments={[makeDepartment()]}
        initialValues={makeValues()}
        isSubmitting
        submitLabel="Create ticket"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toBeDisabled();
    // The loading spinner adds its own text to the accessible name, so
    // match on role alone rather than role + name.
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
