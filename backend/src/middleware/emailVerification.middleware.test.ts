import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireVerifiedEmail } from "./emailVerification.middleware.js";
import { UserRepository } from "../database/repositry/user.repository.js";

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

const next = vi.fn();
const res = {} as any;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requireVerifiedEmail", () => {
  it("rejects with 401 when there is no authenticated user on the request", async () => {
    const req = { user: undefined } as any;

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("rejects with 401 when the user id doesn't resolve to a real user", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(null);
    const req = { user: { id: "u1", email: "a@example.com", role: "user" } } as any;

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("rejects with 403 when the user's email isn't verified", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "u1", isVerified: false } as any);
    const req = { user: { id: "u1", email: "a@example.com", role: "user" } } as any;

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("calls next() with no error when the user is verified", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "u1", isVerified: true } as any);
    const req = { user: { id: "u1", email: "a@example.com", role: "user" } } as any;

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("wraps an unexpected repository error into a generic 500", async () => {
    vi.mocked(UserRepository.findById).mockRejectedValue(new Error("db down"));
    const req = { user: { id: "u1", email: "a@example.com", role: "user" } } as any;

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});
