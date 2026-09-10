import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { AuthProvider } from "../AuthProvider";
import { useAuth } from "../../../hooks/useAuth";
import type { SafeUser } from "../../../types/user";

const SESSION_STORAGE_KEY = "tms.session.user";

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../services/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../services/apiClient")>();
  return { ...actual, refreshSession: vi.fn() };
});

import { refreshSession } from "../../../services/apiClient";

function makeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function StatusDisplay() {
  const { status } = useAuth();
  return <p>status: {status}</p>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <StatusDisplay />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("AuthProvider session restore", () => {
  it("silently lands as unauthenticated when there was never a cached session (no toast)", async () => {
    vi.mocked(refreshSession).mockResolvedValue(false);

    renderProvider();

    await waitFor(() => screen.getByText("status: unauthenticated"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("restores a cached session when refresh still succeeds", async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(makeUser()));
    vi.mocked(refreshSession).mockResolvedValue(true);

    renderProvider();

    await waitFor(() => screen.getByText("status: authenticated"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("tells the user why when a previously-valid cached session fails to refresh", async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(makeUser()));
    vi.mocked(refreshSession).mockResolvedValue(false);

    renderProvider();

    await waitFor(() => screen.getByText("status: unauthenticated"));
    expect(toast.error).toHaveBeenCalledWith("Your session has expired. Please sign in again.");
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
