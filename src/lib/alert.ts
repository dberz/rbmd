// Ops alerting. When a lead-capture path fails (Beehiiv create/tag, inquiry
// send), we still respond OK to the visitor but fire a best-effort alert so a
// misconfigured key or outage doesn't silently drop leads for days.
//
// Channel priority:
//   1. OPS_ALERT_WEBHOOK_URL — a generic JSON POST (Slack/Zapier/etc.). Survives
//      even if Resend itself is the thing that's broken.
//   2. Resend email to OPS_ALERT_EMAIL (falls back to INQUIRY_TO_EMAIL).
// Both are optional; if neither is configured we just log to the server.

type AlertInput = {
  subject: string;
  body: string;
  context?: Record<string, unknown>;
};

export async function alertOps({ subject, body, context }: AlertInput) {
  const line = `[RBMD ALERT] ${subject} — ${body}`;
  console.error(line, context ?? {});

  const webhook = import.meta.env.OPS_ALERT_WEBHOOK_URL;
  const resendKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.OPS_ALERT_EMAIL || import.meta.env.INQUIRY_TO_EMAIL;
  const from = import.meta.env.INQUIRY_FROM_EMAIL || "website@robinberzinmd.com";

  const tasks: Promise<unknown>[] = [];

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: line, subject, body, context }),
      }).catch((error) => console.error("Ops webhook failed", error))
    );
  }

  if (resendKey && to) {
    const text = [body, "", context ? JSON.stringify(context, null, 2) : ""]
      .filter(Boolean)
      .join("\n");
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ from, to, subject: `⚠️ ${subject}`, text }),
      }).catch((error) => console.error("Ops alert email failed", error))
    );
  }

  // Best-effort: never let alerting throw into the request path.
  await Promise.allSettled(tasks);
}
