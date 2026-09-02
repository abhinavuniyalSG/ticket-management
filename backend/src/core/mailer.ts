import nodemailer from "nodemailer";
import { SMTP_VARIABLES } from "../config/secrets.js";

export class Mailer {
  private transporter = nodemailer.createTransport({
    host: SMTP_VARIABLES.SMTP_HOST,
    port: Number(SMTP_VARIABLES.SMTP_PORT),
    secure: SMTP_VARIABLES.SMTP_SECURE,
    auth: {
      user: SMTP_VARIABLES.SMTP_USER,
      pass: SMTP_VARIABLES.SMTP_PASSWORD,
    },
  });
  public sendMail = async (to: string, subject: string, html: string) => {
    await this.transporter.sendMail({
      from: SMTP_VARIABLES.MAIL_FROM,
      to,
      subject,
      html,
    });
  };
}
