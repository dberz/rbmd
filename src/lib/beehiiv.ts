// Beehiiv lead-magnet routing.
//
// Each opt-in form posts a `leadMagnet` value (see SubscribeBlock / footer form).
// We map that value to the Beehiiv tag(s) that trigger the matching lead-magnet
// automation. Tags are applied via POST /subscriptions/{id}/tags after the
// subscription is created. Beehiiv auto-creates a tag if it doesn't exist, so the
// tag strings here must EXACTLY match the tag your automation listens for.
//
// `automationIds` is optional: if your delivery uses an automation with an
// "Add by API" trigger instead of (or in addition to) a tag, list its id here
// and it will be enrolled at create time.
//
// `sendWelcome` controls Beehiiv's generic welcome email. For lead magnets the
// automation usually sends the asset, so we default those to false to avoid a
// double email; general newsletter signups default to true.

export type LeadMagnetConfig = {
  tags?: string[];
  automationIds?: string[];
  sendWelcome?: boolean;
};

// TODO(RBMD): replace the placeholder tag strings below with the exact tag names
// configured in Beehiiv for each opt-in's lead-magnet automation.
export const leadMagnetConfig: Record<string, LeadMagnetConfig> = {
  // Homepage hero/newsletter, default article CTAs, About, category pages,
  // and the gated supplement-stack post. Beehiiv segment: "Lead Magnet - Longevity Stack".
  "female-longevity-supplement-stack": {
    tags: ["longevity-stack"],
    sendWelcome: false,
  },
  // Deli Meats post. Beehiiv segment: "Lead Magnet - Clean Meat Cheat Sheet".
  "clean-meat-cheat-sheet": {
    tags: ["clean meat cheat sheet"],
    sendWelcome: false,
  },
  // General newsletter signups (footer, nav CTA, newsletter page) — no asset.
  newsletter: {
    tags: ["source:website"],
    sendWelcome: true,
  },
};

export function configForLeadMagnet(slug?: string): LeadMagnetConfig {
  if (slug && leadMagnetConfig[slug]) return leadMagnetConfig[slug];
  return leadMagnetConfig.newsletter;
}
