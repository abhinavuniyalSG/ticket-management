import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { FormField } from "../components/molecules/FormField";
import { Input } from "../components/atoms/Input";
import { Select } from "../components/atoms/Select";
import { Button } from "../components/atoms/Button";
import { IconButton } from "../components/atoms/IconButton";
import { Spinner } from "../components/atoms/Spinner";
import { ErrorState } from "../components/molecules/ErrorState";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../types/api";
import type { User } from "../types/user";
import type { Contact, ContactType } from "../types/contact";
import { CONTACT_TYPES, CONTACT_TYPE_LABELS, ROLE_LABELS } from "../constants/options";

export function ProfilePage() {
  const { user: authUser, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameErrors, setNameErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [isSavingName, setIsSavingName] = useState(false);

  const [contactType, setContactType] = useState<ContactType>("phone");
  const [contactDetail, setContactDetail] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [removingContactId, setRemovingContactId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProfile = () => {
    if (!authUser) return;
    setIsLoading(true);
    setError(null);
    userService
      .getById(authUser.id)
      .then((res) => {
        setProfile(res.user);
        setFirstName(res.user.firstName);
        setLastName(res.user.lastName);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load your profile.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadProfile, [authUser]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <ErrorState message={error ?? "Unable to load your profile."} onRetry={loadProfile} />
      </PageContainer>
    );
  }

  const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof nameErrors = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    setNameErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSavingName(true);
    try {
      const res = await userService.update(profile.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfile(res.user);
      setUser(res.user);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update your profile.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAddContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactError(null);
    if (!contactDetail.trim()) {
      setContactError("Contact detail is required");
      return;
    }

    setIsAddingContact(true);
    try {
      const res = await userService.addContact({
        contactType,
        contactDetail: contactDetail.trim(),
      });
      setProfile((prev) => (prev ? { ...prev, contacts: [...(prev.contacts ?? []), res.contact] } : prev));
      setContactDetail("");
      toast.success(res.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to add contact.";
      setContactError(message);
      toast.error(message);
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleRemoveContact = async (contact: Contact) => {
    setRemovingContactId(contact.id);
    try {
      const res = await userService.removeContact(contact.id);
      setProfile((prev) =>
        prev ? { ...prev, contacts: (prev.contacts ?? []).filter((c) => c.id !== contact.id) } : prev,
      );
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to remove contact.");
    } finally {
      setRemovingContactId(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await userService.remove(profile.id);
      toast.success(res.message);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete your account.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Manage your account details and contact information." />

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Personal information</h2>
          <form onSubmit={(e) => void handleSaveName(e)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="profile-first-name" error={nameErrors.firstName} required>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  maxLength={50}
                  invalid={Boolean(nameErrors.firstName)}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSavingName}
                />
              </FormField>
              <FormField label="Last name" htmlFor="profile-last-name" error={nameErrors.lastName}>
                <Input
                  id="profile-last-name"
                  value={lastName}
                  maxLength={50}
                  invalid={Boolean(nameErrors.lastName)}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSavingName}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Email" htmlFor="profile-email">
                <Input id="profile-email" value={profile.email} disabled readOnly />
              </FormField>
              <FormField label="Role" htmlFor="profile-role">
                <Input id="profile-role" value={ROLE_LABELS[profile.role]} disabled readOnly />
              </FormField>
            </div>
            <FormField label="Department" htmlFor="profile-department">
              <Input
                id="profile-department"
                value={profile.department?.departmentName ?? "Unassigned"}
                disabled
                readOnly
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSavingName}>
                Save changes
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Contacts</h2>

          {profile.contacts && profile.contacts.length > 0 ? (
            <ul className="mb-4 flex flex-col gap-2">
              {profile.contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {CONTACT_TYPE_LABELS[contact.contactType]}
                    </p>
                    <p className="truncate text-sm text-slate-800">{contact.contactDetail}</p>
                  </div>
                  <IconButton
                    label="Remove contact"
                    variant="danger"
                    disabled={removingContactId === contact.id}
                    onClick={() => void handleRemoveContact(contact)}
                    icon={
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                        <path
                          d="M5 5l10 10M15 5L5 15"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-slate-500">No contacts added yet.</p>
          )}

          <form
            onSubmit={(e) => void handleAddContact(e)}
            className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end"
          >
            <FormField label="Type" htmlFor="contact-type" required>
              <Select
                id="contact-type"
                value={contactType}
                options={CONTACT_TYPES.map((t) => ({ value: t, label: CONTACT_TYPE_LABELS[t] }))}
                onChange={(e) => setContactType(e.target.value as ContactType)}
                disabled={isAddingContact}
              />
            </FormField>
            <div className="flex-1">
              <FormField label="Detail" htmlFor="contact-detail" error={contactError ?? undefined} required>
                <Input
                  id="contact-detail"
                  value={contactDetail}
                  maxLength={500}
                  invalid={Boolean(contactError)}
                  onChange={(e) => setContactDetail(e.target.value)}
                  disabled={isAddingContact}
                  placeholder="e.g. +1 555 000 1234"
                />
              </FormField>
            </div>
            <Button type="submit" isLoading={isAddingContact}>
              Add contact
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
          <p className="mt-1 text-sm text-red-700">
            Deleting your account is permanent and cannot be undone.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setIsDeleteOpen(true)}>
            Delete account
          </Button>
        </section>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete your account"
        message="This will permanently delete your account and cannot be undone."
        confirmLabel="Delete account"
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageContainer>
  );
}
