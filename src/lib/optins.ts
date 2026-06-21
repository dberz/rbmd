// Holistic opt-in configuration for the article experience.
//
// Three conversion surfaces per post:
//   1. Inline CTA block (always) — topic-matched copy via `postCta`.
//   2. Email gate (high-traffic posts) — `gatedPosts` splits the article and
//      hides the payoff behind an email capture.
//   3. Related posts — always surfaces the gated supplement-stack post as a
//      recurring lead driver.

export type PostCta = {
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  leadMagnet?: string;
};

export type GateConfig = PostCta & {
  // Heading text the article is split before. The payoff (this heading onward)
  // is hidden until the reader subscribes. Choose a marker that is plain text.
  markerHeading: string;
};

// The gated post that should always appear in related lists as a lead driver.
export const PINNED_RELATED_SLUG = "my-personal-supplement-stack";

// Posts gated behind an email wall (add your highest-traffic posts here).
export const gatedPosts: Record<string, GateConfig> = {
  "my-personal-supplement-stack": {
    markerHeading: "My personal supplement stack",
    leadMagnet: "female-longevity-supplement-stack",
    eyebrow: "Read the full protocol",
    title: "Enter your email to see Robin's exact supplement stack",
    description:
      "The complete list — every brand, dose, and timing Robin personally takes — plus her free Ultimate Female Longevity Supplement Stack. Unlock it instantly.",
    buttonText: "Unlock the stack",
  },
};

// Optional per-post inline CTA copy. Falls back to the lead-magnet defaults.
export const postCta: Record<string, PostCta> = {
  "can-processed-deli-meats-be-healthy": {
    leadMagnet: "clean-meat-cheat-sheet",
    eyebrow: "Free download",
    title: "Get the Clean Meat Cheat Sheet",
    description:
      "The exact brands and labels Robin trusts for nitrate-free, low-toxin deli meat — a printable cheat sheet for your next grocery run.",
    buttonText: "Send me the cheat sheet",
  },
};

export function isGated(slug: string) {
  return Boolean(gatedPosts[slug]);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Inner tags/whitespace allowed between the heading tag and its text
// (e.g. <h2><strong>Marker</strong></h2>).
const INNER = "(?:\\s|<[^>]+>)*";

// Split article HTML immediately before the configured marker heading.
export function splitAtHeading(html: string, marker: string) {
  const re = new RegExp(`<h[1-4][^>]*>${INNER}${escapeRegExp(marker)}`, "i");
  const match = re.exec(html);
  if (!match) return { teaser: html, locked: "" };
  return { teaser: html.slice(0, match.index), locked: html.slice(match.index) };
}

// Remove the trailing legacy "Keep Reading" block — we render our own related row.
export function stripKeepReading(html: string) {
  const re = new RegExp(`<h[1-4][^>]*>${INNER}keep reading`, "i");
  const match = re.exec(html);
  if (match && match.index > html.length * 0.5) return html.slice(0, match.index);
  return html;
}
