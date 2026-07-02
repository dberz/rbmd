# RBMD Dual-Format Generation Prompt (v2)

One generation run per article now produces TWO independent compositions of the
same concept — never crop one from the other:

| Format | Generate at | Final crop | Used for |
|---|---|---|---|
| Portrait 4:5 | 1024x1536 | 1080x1350 | Instagram feed post, on-site cards + article hero |
| Landscape 1.91:1 | 1536x1024 | 1200x630 | og:image / Twitter card, Beehiiv email header |

Landscape finals belong in `public/images/articles/rbmd-cut-paper-v1/<slug>.webp`
— the article template automatically serves them as og:image when present.

---

## Prompt template

Replace `{{...}}` fields from the article JSON (same fields `images:plan` already extracts).

### Shared style block (identical for both formats)

```
Style system: RBMD Editorial Cut-Paper Collage v1.
Create sophisticated paper-cut editorial collage art for Robin Berzin MD article imagery.
The art direction borrows the idea of witty, topic-led newsletter illustration, but the final tone must be calmer, more premium, and medically credible.
Use flat layered cut-paper forms, deckled edges, matte paper fibers, subtle offset alignment, and soft shallow shadows.
Use one central visual metaphor supported by 3-6 secondary medical, botanical, nutrition, metabolic, or lifestyle symbols.
Palette: off-white #FAF7F7, cream #EEE8E7, beige #BE9F90, medium brown #795A4A, dark brown #3C1A18, dark terracotta #6F2E0F, and one restrained lilac #DBC7F1 accent.
Avoid large lilac backgrounds, bright colors, gradients, glossy rendering, photorealism, generic stock wellness imagery, people, faces, bodies, hands, cartoon mascots, gore, fear-based medical imagery, text, letters, words, numbers, logos, and watermarks.
Output: finished editorial illustration only, no text, no words, no numbers, no captions, no logo, no watermark.

Article title: {{title}}
Article excerpt: {{excerpt}}
Category: {{category}}
Visual brief: {{visual_brief}}
```

### Format block A — portrait (append for the 1024x1536 run)

```
Format: vertical 4:5 Instagram feed illustration, generated at 1024x1536 and cropped to 1080x1350.
Composition: stack the concept vertically — one bold central metaphor in the middle third, secondary symbols radiating above and below it.
The image must read instantly at phone-feed size: bold silhouettes, high figure-ground contrast, generous margins on all four edges.
Keep the lower-right signature zone visually quiet; no important detail in the bottom-right 20% x 14% area (deterministic RBMD logo overlay).
Safe area: keep all key elements inside the central 1080x1350 region — nothing critical in the top or bottom 8% of the canvas.
```

### Format block B — landscape (append for the 1536x1024 run)

```
Format: horizontal editorial illustration, generated at 1536x1024 and cropped to 1200x630 for social link previews and email headers.
Composition: re-stage the SAME central metaphor and supporting symbols as a wide scene — central metaphor offset left or right of center, secondary symbols distributed horizontally, asymmetric balance.
Do not simply widen the portrait composition; design natively for the wide frame.
The image must survive a center crop to 1.91:1: keep every important element inside the central 1536x806 band — nothing critical in the top or bottom 11% of the canvas.
Keep the lower-right signature zone visually quiet; no important detail in the bottom-right 20% x 14% area.
Bold thumbnail readability at 500px wide (how it appears in an iMessage/Slack/X link card).
```

---

## Consistency tip

Generate the portrait first, then pass it as the reference image for the
landscape run ("Recreate this exact cut-paper collage concept, palette, and
paper texture as a native landscape composition") — GPT Images holds the
concept across formats far better with a visual anchor than with text alone.

## Post-processing

Portrait: existing pipeline (crop 1080x1350, logo overlay, webp) →
`public/images/articles/rbmd-instagram-cut-paper-v1/<slug>.webp`

Landscape: center-crop 1536x806 → resize 1200x630, logo overlay, webp →
`public/images/articles/rbmd-cut-paper-v1/<slug>.webp`
(For OG we keep the full 1536x1024 file in that directory today; a 1200x630
derivative is also acceptable — anything ≥1200px wide at ~1.91:1 works.)
