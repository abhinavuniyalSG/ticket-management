import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { FormField } from "../components/molecules/FormField";
import { Input } from "../components/atoms/Input";
import { Button } from "../components/atoms/Button";
import { Spinner } from "../components/atoms/Spinner";
import { ErrorState } from "../components/molecules/ErrorState";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { useTouched } from "../hooks/useTouched";
import { ApiError } from "../types/api";
import type { User } from "../types/user";
import { ROLE_LABELS } from "../constants/options";

export function ProfilePage() {
  const { user: authUser, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const { markTouched, isTouched } = useTouched<"firstName">();

  const canSaveName = firstName.trim().length > 0;
  const firstNameError = isTouched("firstName") && !canSaveName ? "First name is required" : undefined;

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
    if (!canSaveName) return;

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
      <PageHeader title="Profile" description="Manage your account details." />

      <div className="flex flex-col gap-6">
        <section className="shadow-soft rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Personal information</h2>
          <form onSubmit={(e) => void handleSaveName(e)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="profile-first-name" error={firstNameError} required>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  maxLength={50}
                  placeholder="e.g. Jane"
                  invalid={Boolean(firstNameError)}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={markTouched("firstName")}
                  disabled={isSavingName}
                />
              </FormField>
              <FormField label="Last name" htmlFor="profile-last-name">
                <Input
                  id="profile-last-name"
                  value={lastName}
                  maxLength={50}
                  placeholder="e.g. Doe"
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
              <Button
                type="submit"
                isLoading={isSavingName}
                disabled={!canSaveName}
                title={canSaveName ? undefined : "Enter your first name."}
              >
                Save changes
              </Button>
            </div>
          </form>
        </section>

        <section className="shadow-soft rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Security</h2>
          <p className="mt-1 text-sm text-slate-500">Change the password used to sign in to your account.</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate("/profile/change-password")}>
            Change password
          </Button>
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
