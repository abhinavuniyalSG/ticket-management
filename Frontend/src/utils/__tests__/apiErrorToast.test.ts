import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";
import { getApiErrorMessage, showApiErrorToast } from "../apiErrorToast";
import { ApiError } from "../../types/api";

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getApiErrorMessage", () => {
  it("returns the ApiError's own message", () => {
    expect(getApiErrorMessage(new ApiError(400, "Bad input"), "fallback")).toBe(
      "Bad input",
    );
  });

  it("returns the fallback for a non-ApiError", () => {
    expect(getApiErrorMessage(new Error("network down"), "fallback")).toBe(
      "fallback",
    );
    expect(getApiErrorMessage("weird throw", "fallback")).toBe("fallback");
  });
});

describe("showApiErrorToast", () => {
  it("shows the ApiError's message", () => {
    showApiErrorToast(new ApiError(400, "Bad input"), "fallback");
    expect(toast.error).toHaveBeenCalledWith("Bad input");
  });

  it("shows the fallback for a non-ApiError", () => {
    showApiErrorToast(new Error("network down"), "fallback");
    expect(toast.error).toHaveBeenCalledWith("fallback");
  });

  it("shows nothing when the session has already expired", () => {
    showApiErrorToast(new ApiError(401, "Unauthorized", undefined, true), "fallback");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
