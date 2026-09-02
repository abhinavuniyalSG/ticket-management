import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Spinner } from "../../components/atoms/Spinner";
import { ErrorState } from "../../components/molecules/ErrorState";
import { TicketForm } from "../../components/organisms/TicketForm";
import type { TicketFormValues } from "../../components/organisms/TicketForm";
import { ticketService } from "../../services/ticketService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type { Ticket } from "../../types/ticket";
import { canEditTicketContent } from "../../utils/ticketPermissions";

export function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    ticketService
      .getById(id)
      .then((res) => setTicket(res.ticket))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load this ticket.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (!id) return <Navigate to="/tickets" replace />;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !ticket) {
    return (
      <PageContainer>
        <ErrorState message={error ?? "Unable to load this ticket."} />
      </PageContainer>
    );
  }

  if (!user || !canEditTicketContent(ticket, user)) {
    return (
      <PageContainer>
        <ErrorState
          title="You can't edit this ticket"
          message="Only the creator can edit a ticket, and only while it is still open."
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await ticketService.update(ticket.ticketId, {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
      });
      toast.success(res.message);
      navigate(`/tickets/${ticket.ticketId}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update this ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Edit ticket" description="Update the ticket details." />
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <TicketForm
          mode="edit"
          departments={[]}
          departmentName={ticket.department?.departmentName}
          initialValues={{
            title: ticket.title,
            description: ticket.description,
            departmentId: ticket.departmentId,
            priority: ticket.priority,
            assignedToId: ticket.assignedToId ?? "",
          }}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      </div>
    </PageContainer>
  );
}
