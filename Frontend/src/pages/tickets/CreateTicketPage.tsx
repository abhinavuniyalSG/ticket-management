import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Spinner } from "../../components/atoms/Spinner";
import { ErrorState } from "../../components/molecules/ErrorState";
import { TicketForm } from "../../components/organisms/TicketForm";
import type { TicketFormValues } from "../../components/organisms/TicketForm";
import { ticketService } from "../../services/ticketService";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import { canAssignOnCreate } from "../../utils/ticketPermissions";

export function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showAssignee = user ? canAssignOnCreate(user) : false;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      departmentService.list(),
      showAssignee ? userService.list() : Promise.resolve({ message: "", users: [] }),
    ])
      .then(([deptRes, userRes]) => {
        setDepartments(deptRes.departments);
        setUsers(userRes.users);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load form data.");
      })
      .finally(() => setIsLoading(false));
  }, [showAssignee]);

  const assignableUsers = useMemo(
    () => users.filter((u) => u.departmentId === selectedDepartmentId),
    [users, selectedDepartmentId],
  );

  const handleSubmit = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await ticketService.create({
        title: values.title.trim(),
        description: values.description.trim(),
        departmentId: values.departmentId,
        priority: values.priority,
        assignedToId: values.assignedToId || undefined,
      });
      toast.success(res.message);
      navigate(`/tickets/${res.ticket.ticketId}`, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to create the ticket.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Create ticket" description="Describe the issue and route it to a department." />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && (
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <TicketForm
            mode="create"
            departments={departments}
            assignableUsers={assignableUsers}
            showAssignee={showAssignee}
            initialValues={{
              title: "",
              description: "",
              departmentId: "",
              priority: "low",
              assignedToId: "",
            }}
            isSubmitting={isSubmitting}
            submitLabel="Create ticket"
            onSubmit={handleSubmit}
            onDepartmentChange={setSelectedDepartmentId}
          />
        </div>
      )}
    </PageContainer>
  );
}
