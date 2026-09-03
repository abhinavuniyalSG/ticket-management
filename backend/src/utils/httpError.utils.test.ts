import { describe, it, expect } from "vitest";
import { HttpError } from "./httpError.utils.js";

describe("HttpError", () => {
  it("stores the status code and message it was created with", () => {
    const error = new HttpError(404, "Ticket not found");

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Ticket not found");
  });

  it("is a real Error, so it works with try/catch and instanceof checks", () => {
    const error = new HttpError(400, "Bad request");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });
});
