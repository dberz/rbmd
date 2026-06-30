import type { APIRoute } from "astro";
import { isEmail, jsonResponse, readString } from "@lib/forms";
import { configForLeadMagnet } from "@lib/beehiiv";
import { alertOps } from "@lib/alert";

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

  const utmSource = readString(form, "utmSource");
  const utmMedium = readString(form, "utmMedium");
  const utmCampaign = readString(form, "utmCampaign");
  const leadMagnet = readString(form, "leadMagnet");

  // Beehiiv custom fields must ALREADY EXIST on the publication (names are
  // case-sensitive); unknown fields are silently discarded. Keys below map
  // exactly to the publication's custom-field names. Acquisition (acq_*) and
  // referrer_url mirror the native UTM/referrer for segmentation + export;
  // the rest capture on-site conversion context.
  const fieldValues: Record<string, string> = {
    // Where the lead came from
    acq_source: utmSource,
    acq_medium: utmMedium,
    acq_campaign: utmCampaign,
    acq_term: readString(form, "utmTerm"),
    acq_content: readString(form, "utmContent"),
    referrer_url: readString(form, "referrer"),
    entry_page: readString(form, "landingPage"), // "landing_page" is reserved in Beehiiv
    // What converted them
    signup_page: readString(form, "sourcePage"),
    signup_placement: readString(form, "placement"),
    lead_magnet: leadMagnet,
    article_slug: readString(form, "articleSlug"),
    content_category: readString(form, "category"),
    signup_device: readString(form, "device"),
  };
  const customFields = Object.entries(fieldValues)
    .filter(([, value]) => value)
    .map(([name, value]) => ({ name, value }));

  const cfg = configForLeadMagnet(leadMagnet);

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
      utm_campaign: utmCampaign || fieldValues.signup_placement || "website",
      custom_fields: customFields,
      ...(cfg.automationIds?.length ? { automation_ids: cfg.automationIds } : {}),
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error("Beehiiv subscribe failed", createRes.status, text);
    await alertOps({
      subject: "Beehiiv subscribe failed",
      body: `A signup could not be created in Beehiiv (HTTP ${createRes.status}). The lead may be lost — check the API key and publication ID.`,
      context: { email, status: createRes.status, response: text.slice(0, 500), fieldValues },
    });
    return jsonResponse({ ok: false, message: "Subscription failed. Please try again." }, 502);
  }

  // Apply the opt-in's tag(s) so the matching lead-magnet automation fires.
  // A tag failure means the subscriber exists but the lead-magnet automation
  // won't trigger — retry once, then alert.
  if (cfg.tags?.length) {
    try {
      const created = await createRes.json();
      const subscriptionId = created?.data?.id;
      if (subscriptionId) {
        const tagUrl = `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}/tags`;
        const tagBody = JSON.stringify({ tags: cfg.tags });
        let tagRes = await fetch(tagUrl, { method: "POST", headers, body: tagBody });
        if (!tagRes.ok) {
          tagRes = await fetch(tagUrl, { method: "POST", headers, body: tagBody });
        }
        if (!tagRes.ok) {
          const tagText = await tagRes.text();
          console.error("Beehiiv tag failed", tagRes.status, tagText);
          await alertOps({
            subject: "Beehiiv tag failed",
            body: `Subscriber ${email} was created but tagging failed (HTTP ${tagRes.status}), so the lead-magnet automation may not fire.`,
            context: { email, tags: cfg.tags, status: tagRes.status, response: tagText.slice(0, 500) },
          });
        }
      }
    } catch (error) {
      console.error("Beehiiv tag error", error);
      await alertOps({
        subject: "Beehiiv tag error",
        body: `Unexpected error tagging subscriber ${email}; lead-magnet automation may not fire.`,
        context: { email, tags: cfg.tags, error: String(error) },
      });
    }
  }

  return jsonResponse({ ok: true, message: "You're subscribed." });
};
