# RobinBerzinMD.com — Growth Audit & Plan

_Second-pass review of the Codex build. Scope: Beehiiv, SEO/GEO, lead capture._
_Status: PROPOSAL — nothing below is built yet. Approve / cut items, then I implement._

## Verdict

The architecture is right and the plumbing works. OptinMonster and WordPress are
gone; native forms post to `/api/subscribe` (Beehiiv) and `/api/inquiry` (Resend),
content is JSON collections, schema + `llms.txt` + sitemap are in place. The gaps
are **finish-the-wiring** and **expand-coverage**, not rebuild. Items are ordered by
leverage within each area, and tagged **[code]** (I do it) or **[config]** (your side,
in Beehiiv / Vercel — I'll give exact values).

---

## 1. Beehiiv — wire it up for real

The single highest risk: if env vars or tags are wrong, **every signup silently
succeeds to the user but never reaches Beehiiv or triggers a delivery.** The code
returns a friendly success even when `BEEHIIV_API_KEY` is missing (returns 202).

1. **[config] Confirm Vercel env vars are set in Production:** `BEEHIIV_API_KEY`,
   `BEEHIIV_PUBLICATION_ID`, `INQUIRY_TO_EMAIL`, `RESEND_API_KEY`,
   `PUBLIC_GA4_MEASUREMENT_ID`. If any is blank, that feature no-ops silently.
2. **[config] Replace placeholder tags with real Beehiiv tag names.**
   `src/lib/beehiiv.ts` ships TODO placeholders: `longevity-stack`,
   `clean meat cheat sheet`, `source:website`. These must match the exact tag your
   Beehiiv automations listen for. I'll update the file once you confirm the real
   strings (recommend standardizing on kebab-case: `lead-magnet-longevity-stack`,
   `lead-magnet-clean-meat`, `source-website`).
3. **[config] Confirm the 5 custom fields exist in Beehiiv** (`source_page`,
   `placement`, `lead_magnet`, `article_slug`, `category`). Beehiiv silently
   discards unknown fields — if they aren't pre-created, you lose all attribution.
4. **[config] Confirm each lead-magnet automation exists** and actually sends the
   asset PDF (the code sets `send_welcome_email:false` for magnets, trusting the
   automation to deliver). No automation = subscriber gets nothing.
5. **[code] Make failures loud, not silent.** Add a server-side failure path that
   (a) still 200s the user but (b) logs hard and optionally pings you (Resend email
   or a webhook) when Beehiiv create/tag fails, so a misconfigured prod doesn't
   quietly drop leads for days. Also: the tag call is a separate request after
   create — if it fails the subscriber exists but is untagged (no delivery). Add a
   single retry + failure log.
6. **[code, optional] Bot protection.** Today it's a honeypot only. If list spam
   becomes a problem, add Cloudflare Turnstile (free, invisible) to the subscribe
   path. Low priority unless you see junk signups.

_Verification step: I'll add a one-shot `scripts/check-beehiiv.mjs` that pings the
publication and lists current tags + custom fields so you can diff against the code._

---

## 2. SEO / GEO — from good to authoritative

Foundations are present (Person/WebSite/Article/Breadcrumb/FAQ schema, llms.txt,
redirects). The upgrades below target E-E-A-T and AI-answer extraction for a
physician health brand, where trust signals matter more than for a generic blog.

1. **[code] Upgrade article schema to `MedicalWebPage` + richer author.** Add
   `reviewedBy` / `lastReviewed` (you have `modified` dates), `medicalAudience`,
   and a real author entity. Google and AI engines weight physician-reviewed health
   content far higher (YMYL). Cheap, high-impact.
2. **[code] Enrich the Person/Organization schema with `sameAs`.** Today it only
   links Parsley. Add Instagram, LinkedIn, Facebook, the book, and any
   Wikipedia/press profiles so engines resolve Robin as a known entity — the core
   of GEO ("who is this and why trust them").
3. **[code] robots.txt + llms.txt discoverability.** Wildcard already allows AI
   crawlers, but make it explicit and friendly: name GPTBot, ClaudeBot/anthropic-ai,
   PerplexityBot, Google-Extended, CCBot as allowed, and reference `llms.txt`. Add
   `llms-full.txt` (full-text dump of cornerstone articles) which AI engines
   increasingly prefer for extraction.
4. **[code] Add `lastmod` to the sitemap.** It currently emits bare `<loc>`. You
   have `modified`/`date` on every article — emitting `<lastmod>` measurably
   improves crawl freshness and recency signals.
5. **[code] Add `speakable` + tighten meta.** `speakable` schema on cornerstone
   answers helps voice/AI surfaces. Audit auto-generated meta descriptions (some
   fall back to the first 155 chars of body, which can be weak) — I'll flag the
   weak ones and write proper ones.
6. **[code] Top-level `Organization` (publisher) schema with logo** so article
   `publisher` resolves to a real entity, not an inline stub.
7. **[content] GEO content pattern.** For the cornerstone posts, ensure each opens
   with a clean, extractable definition/answer block (you already do "Robin's Short
   Version" — formalize that into a consistent schema-friendly TL;DR across the top
   20 posts). This is what gets quoted in AI answers.

---

## 3. Lead capture — expand the surface

Capture mechanics are good but coverage is thin: **1 gated post, 2 lead magnets,
and no exit/scroll trigger** (a net regression from OptinMonster, which did
behavioral triggering).

1. **[code] Add a native scroll-depth / exit-intent capture.** Lightweight,
   dismissible, frequency-capped (one impression per N days, suppressed once
   subscribed). This replaces the main thing OptinMonster did and is likely your
   biggest single capture lift. ~1 component + small script, no dependencies.
2. **[content+code] Topic-matched lead magnets for each hub.** Right now nearly
   every CTA offers the same supplement stack. Add 3–4 magnets mapped to your
   highest-traffic clusters, e.g.:
   - "100 Labs Checklist" (PDF) → gate/CTA on the labs cornerstone
   - "Perimenopause Symptom Tracker" → women's-health hub
   - "VO₂ Max / Muscle training starter" → longevity hub
   Each is one JSON file + a Beehiiv tag + the asset. Relevance lifts conversion
   far more than volume of placements.
3. **[code] Gate 2–3 more cornerstone posts.** The gate engine already exists
   (`gatedPosts` in `optins.ts`); extend it to your top-traffic articles with a
   topic-matched magnet. Note: the gate is a *soft* gate — locked content is in the
   DOM (hidden via CSS) so Google still indexes the full article (good for SEO) but
   it's bypassable by view-source. That's the right tradeoff for SEO; just know it's
   a nudge, not a paywall.
4. **[code] Real success state, not just status text.** On submit, show a proper
   confirmation with the immediate next step (download link / "check your inbox") +
   a follow-on ask (follow on Instagram, read the next cornerstone). Converts a
   one-time capture into engagement.
5. **[code] Verify mobile CTA placement.** The primary article CTA lives in a
   right rail (`article-aside`). On mobile that aside stacks — confirm it lands
   mid-article, not buried at the bottom. Inline mid-article placement converts
   best on phones (likely the majority of traffic).
6. **[analytics] Confirm GA4 conversions.** `generate_lead` and `contact_submit`
   fire client-side — make sure they're marked as Conversions in GA4 and
   segmentable by `placement` / `lead_magnet` so we can see which surfaces win.

---

## Suggested sequencing

- **Phase 1 (unblock revenue plumbing):** §1 items 1–4 (your Beehiiv/Vercel
  config) + §1.5 (loud failures) + §2.4 sitemap lastmod + §2.1–2.2 schema. Low
  effort, removes silent-failure risk, strengthens trust signals.
- **Phase 2 (capture lift):** §3.1 exit/scroll capture, §3.4 success state,
  §3.5 mobile CTA. The conversion-rate work.
- **Phase 3 (coverage):** §3.2 + §3.3 topic magnets and more gates, §2.3 + §2.7
  GEO content pass. The scale work.

Each phase ends with a verification step (build/check, schema validation via
Google Rich Results test, and a live form→Beehiiv smoke test).

## What I need from you to start

- The real Beehiiv **tag names** and confirmation the **custom fields** +
  **automations** exist (or I'll spec exactly what to create).
- Confirmation the **Vercel env vars** are populated in Production.
- Which **lead magnets** you actually have assets for (so §3.2 is real, not
  aspirational).
