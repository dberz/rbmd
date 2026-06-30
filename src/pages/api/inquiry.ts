import type { APIRoute } from "astro";
import { isEmail, jsonResponse, readString } from "@lib/forms";
import { alertOps } from "@lib/alert";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const honeypot = readString(form, "company");
  if (honeypot) return jsonResponse({ ok: true, message: "Thanks." });

  const name = readString(form, "name");
  const email = readString(form, "email").toLowerCase();
  const inquiryType = readString(form, "inquiryType") || "General Inquiries";
  const organization = readString(form, "organization");
  const message = readString(form, "message");
  const sourcePage = readString(form, "sourcePage") || "contact";

  if (!name || !isEmail(email) || !message) {
    return jsonResponse({ ok: false, message: "Name, email, and message are required." }, 400);
  }

  const to = import.meta.env.INQUIRY_TO_EMAIL;
  const resendKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.INQUIRY_FROM_EMAIL || "website@robinberzinmd.com";

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Type: ${inquiryType}`,
    organization ? `Organization: ${organization}` : "",
    `Source: ${sourcePage}`,
    "",
    message,
  ].filter(Boolean).join("\n");

  if (!to || !resendKey) {
    console.info("Inquiry email env vars missing; accepted inquiry locally", { to, name, email, inquiryType, organization, sourcePage, message });
    return jsonResponse({ ok: true, message: "Thanks. Your inquiry was received." }, 202);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${resendKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `RBMD ${inquiryType}: ${name}`,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Inquiry email failed", response.status, body);
    await alertOps({
      subject: "Inquiry delivery failed",
      body: `A ${inquiryType} inquiry from ${name} <${email}> could not be emailed (HTTP ${response.status}). Reach out to them directly.`,
      context: { name, email, inquiryType, organization, message, status: response.status },
    });
    return jsonResponse({ ok: false, message: "Inquiry failed. Please try again." }, 502);
  }

  return jsonResponse({ ok: true, message: "Thanks. Your inquiry was received." });
};
