import type { APIRoute } from "astro";
import { isEmail, jsonResponse, readString } from "@lib/forms";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = readString(form, "email").toLowerCase();
  const honeypot = readString(form, "company");

  if (honeypot) return jsonResponse({ ok: true, message: "Thanks." });
  if (!isEmail(email)) return jsonResponse({ ok: false, message: "Enter a valid email." }, 400);

  const apiKey = import.meta.env.BEEHIIV_API_KEY;
  const publicationId = import.meta.env.BEEHIIV_PUBLICATION_ID;

  const customFields = [
    "sourcePage",
    "placement",
    "leadMagnet",
    "articleSlug",
    "category",
    "utmSource",
    "utmMedium",
    "utmCampaign",
  ].reduce<Record<string, string>>((acc, key) => {
    const value = readString(form, key);
    if (value) acc[key] = value;
    return acc;
  }, {});

  if (!apiKey || !publicationId) {
    console.info("Beehiiv env vars missing; accepted subscription locally", { email, customFields });
    return jsonResponse({ ok: true, message: "You're subscribed." }, 202);
  }

  const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: customFields.utmSource || "rbmd-site",
      utm_medium: customFields.utmMedium || "native-form",
      utm_campaign: customFields.utmCampaign || customFields.placement || "website",
      custom_fields: customFields,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Beehiiv subscribe failed", response.status, text);
    return jsonResponse({ ok: false, message: "Subscription failed. Please try again." }, 502);
  }

  return jsonResponse({ ok: true, message: "You're subscribed." });
};
