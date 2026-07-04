import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "AUIS Helpdesk <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  // Email is optional — if no API key is configured, silently skip instead of
  // crashing the request. Ticket/comment actions still work without it.
  if (!resend) {
    console.log(`[email skipped - no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

const wrapper = (title: string, body: string, ticketId: string) => `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
    <div style="background: #14213D; color: #C9A24B; padding: 16px 24px; font-size: 12px; letter-spacing: 1px;">
      AUIS · IT DESK
    </div>
    <div style="padding: 24px; border: 1px solid #D7DDE9; border-top: none;">
      <h2 style="color: #14213D; margin: 0 0 12px;">${title}</h2>
      <p style="color: #1C2430; font-size: 14px; line-height: 1.6;">${body}</p>
      <a href="${APP_URL}/tickets/${ticketId}"
         style="display: inline-block; margin-top: 16px; background: #14213D; color: white;
                padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 14px;">
        View ticket
      </a>
    </div>
  </div>
`;

export async function notifyTicketCreated(to: string, ticketTitle: string, ticketId: string) {
  await send(
    to,
    `Ticket received: ${ticketTitle}`,
    wrapper(
      "We've got your ticket",
      `Your request "${ticketTitle}" has been submitted. We'll email you when there's an update.`,
      ticketId
    )
  );
}

export async function notifyStatusChanged(
  to: string,
  ticketTitle: string,
  ticketId: string,
  status: string
) {
  await send(
    to,
    `Ticket update: ${ticketTitle}`,
    wrapper(
      `Status changed to ${status.replace("_", " ").toLowerCase()}`,
      `Your ticket "${ticketTitle}" was just updated.`,
      ticketId
    )
  );
}

export async function notifyNewComment(
  to: string,
  ticketTitle: string,
  ticketId: string,
  authorName: string
) {
  await send(
    to,
    `New reply on: ${ticketTitle}`,
    wrapper(
      "New comment",
      `${authorName} replied on your ticket "${ticketTitle}".`,
      ticketId
    )
  );
}
