import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../core/logger.js";

type Mail = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

const env = (name: string) => process.env[name]?.trim();

export class EmailService {
  private static transporter: Transporter | null = null;
  private static configurationWarningLogged = false;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    const host = env("SMTP_HOST");
    const port = Number(env("SMTP_PORT") || 587);
    if (!host || !env("SMTP_USER") || !env("SMTP_PASSWORD")) {
      if (!this.configurationWarningLogged) {
        logger.warn(
          "Email notifications disabled: SMTP configuration is incomplete",
        );
        this.configurationWarningLogged = true;
      }
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: env("SMTP_SECURE") === "true",
      auth: { user: env("SMTP_USER"), pass: env("SMTP_PASSWORD") },
    });
    return this.transporter;
  }

  public static async send(mail: Mail): Promise<void> {
    const transporter = this.getTransporter();
    const from = env("SMTP_FROM") || env("SMTP_USER");
    if (!transporter || !from) return;
    try {
      await transporter.sendMail({ from, ...mail });
      logger.info("Email notification sent", {
        recipientCount: Array.isArray(mail.to) ? mail.to.length : 1,
        subject: mail.subject,
      });
    } catch (error) {
      logger.error("Failed to send email notification", {
        error,
        to: mail.to,
        subject: mail.subject,
      });
    }
  }
}
