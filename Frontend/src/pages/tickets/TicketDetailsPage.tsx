import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/atoms/Button";
import { Select } from "../../components/atoms/Select";
import { Spinner } from "../../components/atoms/Spinner";
import { StatusBadge } from "../../components/molecules/StatusBadge";
import { PriorityBadge } from "../../components/molecules/PriorityBadge";
import { TicketMeta } from "../../components/molecules/TicketMeta";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { ticketService } from "../../services/ticketService";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type { Ticket, TicketStatus } from "../../types/ticket";
import type { User } from "../../types/user";
import { STATUS_LABELS } from "../../constants/options";
import { fullName } from "../../utils/format";
import {
  canDeleteTicket,
  canEditTicketContent,
  canManageAssignment,
  getAllowedStatusTransitions,
} from "../../utils/ticketPermissions";

const STATUS_ACTION_LABELS: Partial<Record<TicketStatus, string>> = {
  in_progress: "Start progress",
  completed: "Mark as completed",
  review: "Submit for review",
  open: "Reopen ticket",
  closed: "Close ticket",
};

export function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const loadTicket = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    ticketService
      .getById(id)
      .then((res) => setTicket(res.ticket))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError({ status: err.status, message: err.message });
        } else {
          setError({ message: "Unable to load this ticket." });
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const canAssign = user && ticket ? canManageAssignment(ticket, user) : false;

  useEffect(() => {
    if (!canAssign || !ticket) return;
    userService
      .list()
      .then((res) => setAssignees(res.users.filter((u) => u.departmentId === ticket.departmentId)))
      .catch(() => undefined);
  }, [canAssign, ticket]);

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
        <ErrorState
          title={error?.status === 404 ? "Ticket not found" : "Something went wrong"}
          message={error?.message ?? "Unable to load this ticket."}
          onRetry={loadTicket}
        />
      </PageContainer>
    );
  }

  if (!user) return null;

  const allowedTransitions = getAllowedStatusTransitions(ticket, user);
  const canEditContent = canEditTicketContent(ticket, user);
  const canDelete = canDeleteTicket(ticket, user);

  const handleStatusChange = async (status: TicketStatus) => {
    setIsMutating(true);
    try {
      const res = await ticketService.update(ticket.ticketId, { status });
      setTicket(res.ticket);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update ticket status.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    setIsMutating(true);
    try {
      const res = await ticketService.update(ticket.ticketId, { assignedToId: selectedAssignee });
      setTicket(res.ticket);
      setSelectedAssignee("");
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to assign this ticket.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnassign = async () => {
    setIsMutating(true);
    try {
      const res = await ticketService.update(ticket.ticketId, { assignedToId: null });
      setTicket(res.ticket);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to unassign this ticket.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async () => {
    setIsMutating(true);
    try {
      const res = await ticketService.remove(ticket.ticketId);
      toast.success(res.message);
      navigate("/tickets", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete this ticket.");
      setIsDeleteOpen(false);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={ticket.title}
        actions={
          <>
            {canEditContent && (
              <Link
                to={`/tickets/${ticket.ticketId}/edit`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </Link>
            )}
            {canDelete && (
              <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
        </div>

        <TicketMeta ticket={ticket} />

        {(allowedTransitions.length > 0 || canAssign) && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Actions</h2>

            {allowedTransitions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {allowedTransitions.map((status) => (
                  <Button
                    key={status}
                    variant="secondary"
                    disabled={isMutating}
                    onClick={() => void handleStatusChange(status)}
                  >
                    {STATUS_ACTION_LABELS[status] ?? `Move to ${STATUS_LABELS[status]}`}
                  </Button>
                ))}
              </div>
            )}

            {canAssign && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Assignment
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    aria-label="Select assignee"
                    placeholder="Select a team member"
                    value={selectedAssignee}
                    options={assignees.map((u) => ({ value: u.id, label: fullName(u) }))}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    disabled={isMutating}
                    className="sm:max-w-xs"
                  />
                  <Button
                    variant="secondary"
                    disabled={!selectedAssignee || isMutating}
                    onClick={() => void handleAssign()}
                  >
                    {ticket.assignedToId ? "Reassign" : "Assign"}
                  </Button>
                  {ticket.assignedToId && (
                    <Button variant="ghost" disabled={isMutating} onClick={() => void handleUnassign()}>
                      Unassign
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete ticket"
        message="This will permanently delete the ticket. This action cannot be undone."
        confirmLabel="Delete ticket"
        isLoading={isMutating}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageContainer>
  );
}
