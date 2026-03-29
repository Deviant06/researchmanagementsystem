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

export async function sendNotificationEmailAlerts(input: EmailAlertInput) {
  const config = getTransportConfig();

  if (!config || input.recipients.length === 0) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });

  await Promise.all(
    input.recipients.map((recipient) =>
      transporter.sendMail({
        from: config.from,
        to: recipient.email,
        subject: `[ResearchHub TANCU] ${input.title}`,
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
              ? `<p><a href="${input.actionUrl}">Open ResearchHub TANCU</a></p>`
              : ""
          }
        `
      })
    )
  );
}
