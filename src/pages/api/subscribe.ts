import type { APIRoute } from "astro";
import { isEmail, jsonResponse, readString } from "@lib/forms";
import { configForLeadMagnet } from "@lib/beehiiv";

export const prerender = false;

const BEEHIIV_BASE = "https://api.beehiiv.com/v2";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = readString(form, "email").toLowerCase();
  const honeypot = readString(form, "company");

  if (honeypot) return jsonResponse({ ok: true, message: "Thanks." });
  if (!isEmail(email)) return jsonResponse({ ok: false, message: "Enter a valid email." }, 400);

  const apiKey = import.meta.env.BEEHIIV_API_KEY;
  const publicationId = import.meta.env.BEEHIIV_PUBLICATION_ID;

  // Beehiiv custom fields must already exist on the publication, and must be sent
  // as an array of { name, value }. Unknown fields are silently discarded.
  const fieldValues: Record<string, string> = {
    source_page: readString(form, "sourcePage"),
    placement: readString(form, "placement"),
    lead_magnet: readString(form, "leadMagnet"),
    article_slug: readString(form, "articleSlug"),
    category: readString(form, "category"),
  };
  const customFields = Object.entries(fieldValues)
    .filter(([, value]) => value)
    .map(([name, value]) => ({ name, value }));

  const utmSource = readString(form, "utmSource");
  const utmMedium = readString(form, "utmMedium");
  const utmCampaign = readString(form, "utmCampaign");

  const cfg = configForLeadMagnet(fieldValues.lead_magnet);

  if (!apiKey || !publicationId) {
    console.info("Beehiiv env vars missing; accepted subscription locally", { email, fieldValues });
    return jsonResponse({ ok: true, message: "You're subscribed." }, 202);
  }

  const headers = {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };

  const createRes = await fetch(`${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      reactivate_existing: true,
      send_welcome_email: cfg.sendWelcome ?? true,
      utm_source: utmSource || "rbmd-site",
      utm_medium: utmMedium || "native-form",
      utm_campaign: utmCampaign || fieldValues.placement || "website",
      custom_fields: customFields,
      ...(cfg.automationIds?.length ? { automation_ids: cfg.automationIds } : {}),
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error("Beehiiv subscribe failed", createRes.status, text);
    return jsonResponse({ ok: false, message: "Subscription failed. Please try again." }, 502);
  }

  // Apply the opt-in's tag(s) so the matching lead-magnet automation fires.
  if (cfg.tags?.length) {
    try {
      const created = await createRes.json();
      const subscriptionId = created?.data?.id;
      if (subscriptionId) {
        const tagRes = await fetch(
          `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
          { method: "POST", headers, body: JSON.stringify({ tags: cfg.tags }) }
        );
        if (!tagRes.ok) {
          console.error("Beehiiv tag failed", tagRes.status, await tagRes.text());
        }
      }
    } catch (error) {
      console.error("Beehiiv tag error", error);
    }
  }

  return jsonResponse({ ok: true, message: "You're subscribed." });
};
