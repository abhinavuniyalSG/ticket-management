import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMailMock, createTransportMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  createTransportMock: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const ORIGINAL_ENV = { ...process.env };

async function loadEmailService() {
  vi.resetModules();
  const mod = await import("./email.service.js");
  return mod.EmailService;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  delete process.env.SMTP_FROM;
  sendMailMock.mockReset();
  createTransportMock.mockReset();
  createTransportMock.mockReturnValue({ sendMail: sendMailMock });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("send", () => {
  it("does nothing when SMTP configuration is incomplete", async () => {
    const EmailService = await loadEmailService();

    await EmailService.send({ to: "a@example.com", subject: "s", text: "t" });

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends mail through the transporter, defaulting 'from' to SMTP_USER", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASSWORD = "secret";
    const EmailService = await loadEmailService();

    await EmailService.send({ to: "a@example.com", subject: "s", text: "t" });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: "user@example.com", to: "a@example.com", subject: "s", text: "t" }),
    );
  });

  it("prefers SMTP_FROM over SMTP_USER when both are set", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASSWORD = "secret";
    process.env.SMTP_FROM = "noreply@example.com";
    const EmailService = await loadEmailService();

    await EmailService.send({ to: "a@example.com", subject: "s", text: "t" });

    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ from: "noreply@example.com" }));
  });

  it("swallows an error from the transporter instead of throwing", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASSWORD = "secret";
    sendMailMock.mockRejectedValue(new Error("smtp down"));
    const EmailService = await loadEmailService();

    await expect(
      EmailService.send({ to: "a@example.com", subject: "s", text: "t" }),
    ).resolves.toBeUndefined();
  });

  it("reuses the same transporter across multiple sends instead of reconnecting", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASSWORD = "secret";
    const EmailService = await loadEmailService();

    await EmailService.send({ to: "a@example.com", subject: "s1", text: "t1" });
    await EmailService.send({ to: "b@example.com", subject: "s2", text: "t2" });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });
});
