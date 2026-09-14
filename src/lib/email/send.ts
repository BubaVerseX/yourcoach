import { Resend } from "resend";

const FROM_ADDRESS = "ShadowCoach <onboarding@resend.dev>";

/**
 * Thin wrapper around Resend. Returns { skipped: true } when RESEND_API_KEY
 * isn't configured yet (e.g. the Vercel Marketplace Resend integration hasn't
 * been installed) so callers (the reminders cron) can no-op gracefully instead
 * of failing the whole run.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY not set — skipping send to ${params.to}: ${params.subject}`);
    return { skipped: true as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[email] send failed", error);
    return { skipped: false as const, error: error.message };
  }

  return { skipped: false as const };
}
