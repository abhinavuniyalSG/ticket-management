import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "../molecules/FormField";
import { Input } from "../atoms/Input";
import { Textarea } from "../atoms/Textarea";
import { Select } from "../atoms/Select";
import { Button } from "../atoms/Button";
import { PRIORITY_LABELS, TICKET_PRIORITIES } from "../../constants/options";
import type { TicketPriority } from "../../types/ticket";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import { fullName } from "../../utils/format";

export interface TicketFormValues {
  title: string;
  description: string;
  departmentId: string;
  priority: TicketPriority;
  assignedToId: string;
}

interface TicketFormProps {
  mode: "create" | "edit";
  departments: Department[];
  departmentName?: string;
  assignableUsers?: User[];
  showAssignee?: boolean;
  initialValues: TicketFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: TicketFormValues) => void;
  onDepartmentChange?: (departmentId: string) => void;
}

type FormErrors = Partial<Record<"title" | "description" | "departmentId", string>>;

function validate(values: TicketFormValues, mode: "create" | "edit"): FormErrors {
  const errors: FormErrors = {};
  if (values.title.trim().length < 2) {
    errors.title = "Title must be at least 2 characters";
  } else if (values.title.trim().length > 200) {
    errors.title = "Title must not exceed 200 characters";
  }
  if (values.description.trim().length < 5) {
    errors.description = "Description must be at least 5 characters";
  }
  if (mode === "create" && !values.departmentId) {
    errors.departmentId = "Please select a department";
  }
  return errors;
}

export function TicketForm({
  mode,
  departments,
  departmentName,
  assignableUsers = [],
  showAssignee = false,
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onDepartmentChange,
}: TicketFormProps) {
  const [values, setValues] = useState<TicketFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormField label="Title" htmlFor="ticket-title" error={errors.title} required>
        <Input
          id="ticket-title"
          value={values.title}
          maxLength={200}
          invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "ticket-title-error" : undefined}
          onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="ticket-description"
        error={errors.description}
        required
      >
        <Textarea
          id="ticket-description"
          value={values.description}
          rows={5}
          invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "ticket-description-error" : undefined}
          onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
          disabled={isSubmitting}
        />
      </FormField>

      {mode === "create" ? (
        <FormField label="Department" htmlFor="ticket-department" error={errors.departmentId} required>
          <Select
            id="ticket-department"
            value={values.departmentId}
            placeholder="Select a department"
            invalid={Boolean(errors.departmentId)}
            options={departments.map((d) => ({ value: d.departmentId, label: d.departmentName }))}
            onChange={(e) => {
              const departmentId = e.target.value;
              setValues((prev) => ({ ...prev, departmentId, assignedToId: "" }));
              onDepartmentChange?.(departmentId);
            }}
            disabled={isSubmitting}
          />
        </FormField>
      ) : (
        <FormField label="Department" htmlFor="ticket-department-readonly">
          <Input id="ticket-department-readonly" value={departmentName ?? "—"} disabled readOnly />
        </FormField>
      )}

      <FormField label="Priority" htmlFor="ticket-priority">
        <Select
          id="ticket-priority"
          value={values.priority}
          options={TICKET_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, priority: e.target.value as TicketPriority }))
          }
          disabled={isSubmitting}
        />
      </FormField>

      {showAssignee && (
        <FormField
          label="Assignee"
          htmlFor="ticket-assignee"
          hint={
            values.departmentId
              ? "Only members of the selected department can be assigned."
              : "Select a department first."
          }
        >
          <Select
            id="ticket-assignee"
            value={values.assignedToId}
            placeholder="Leave unassigned"
            options={assignableUsers.map((u) => ({ value: u.id, label: fullName(u) }))}
            onChange={(e) => setValues((prev) => ({ ...prev, assignedToId: e.target.value }))}
            disabled={isSubmitting || !values.departmentId}
          />
        </FormField>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
