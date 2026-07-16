import "server-only";

import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  text: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration missing.");
  }

  return { host, port, user, pass };
}

export function getDefaultMailRecipients() {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.CONTACT_TO ?? null;

  if (!to) {
    throw new Error("ADMIN_NOTIFY_EMAIL or CONTACT_TO must be configured.");
  }

  return {
    to,
    from: process.env.SMTP_FROM ?? `Holistique Books <${getSmtpConfig().user}>`,
  };
}

export async function sendServerEmail(options: MailOptions) {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const recipients = getDefaultMailRecipients();

  await transporter.sendMail({
    to: options.to || recipients.to,
    from: recipients.from,
    subject: options.subject,
    text: options.text,
  });
}
