import { APP_NAME } from "@/lib/constants";

import nodemailer from "nodemailer";

interface EmailTarget {
  email: string;
  name: string;
}

interface EmailAlertInput {
  recipients: EmailTarget[];
  title: string;
  message: string;
  actionUrl?: string;
}

interface AccountActionEmailInput {
  email: string;
  name: string;
  subject: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
}

function getTransportConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    from
  };
}

export function isEmailConfigured() {
  return Boolean(getTransportConfig());
}

async function createTransporter() {
  const config = getTransportConfig();

  if (!config) {
    return null;
  }

  return {
    config,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    })
  };
}

export async function sendNotificationEmailAlerts(input: EmailAlertInput) {
  const transport = await createTransporter();

  if (!transport || input.recipients.length === 0) {
    return;
  }

  await Promise.all(
    input.recipients.map((recipient) =>
      transport.transporter.sendMail({
        from: transport.config.from,
        to: recipient.email,
        subject: `[${APP_NAME}] ${input.title}`,
        text: [
          `Hello ${recipient.name},`,
          "",
          input.title,
          input.message,
          input.actionUrl ? "" : null,
          input.actionUrl ? `Open the app: ${input.actionUrl}` : null
        ]
          .filter(Boolean)
          .join("\n"),
        html: `
          <p>Hello ${recipient.name},</p>
          <p><strong>${input.title}</strong></p>
          <p>${input.message}</p>
          ${
            input.actionUrl
              ? `<p><a href="${input.actionUrl}">Open ${APP_NAME}</a></p>`
              : ""
          }
        `
      })
    )
  );
}

export async function sendAccountActionEmail(input: AccountActionEmailInput) {
  const transport = await createTransporter();

  if (!transport) {
    return false;
  }

  await transport.transporter.sendMail({
    from: transport.config.from,
    to: input.email,
    subject: input.subject,
    text: [
      `Hello ${input.name},`,
      "",
      input.intro,
      "",
      `${input.actionLabel}: ${input.actionUrl}`,
      "",
      `If you did not expect this email, you can ignore it.`
    ].join("\n"),
    html: `
      <p>Hello ${input.name},</p>
      <p>${input.intro}</p>
      <p><a href="${input.actionUrl}">${input.actionLabel}</a></p>
      <p>If you did not expect this email, you can ignore it.</p>
    `
  });

  return true;
}
