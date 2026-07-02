# RBMD Dual-Format Prompt Spec

This document describes the prompt contract used by
`scripts/rbmd-article-images.mjs`. The script is the executable source of truth;
this file is the human-readable spec for Codex work and the future API app.

Each article gets two independent image generations:

| Format | Generate at | Final asset | Used for |
| --- | --- | --- | --- |
| Portrait 4:5 | `1024x1536` | `1080x1350` | Instagram feed, on-site cards, article hero |
| Landscape 1.91:1 | `1536x1024` | `1200x630` | `og:image`, Twitter/X card, Beehiiv email header |

Do not crop one final from the other. Generate portrait and landscape as native
compositions of the same concept.

## Shared Style Block

The generated prompt must include this art direction for both formats:

```text
Style system: RBMD Editorial Cut-Paper Collage v1.
Create sophisticated paper-cut editorial collage art for Robin Berzin MD article imagery.
The art direction borrows the idea of witty, topic-led newsletter illustration, but the final tone must be calmer, more premium, and medically credible.
Use flat layered cut-paper forms, deckled edges, matte paper fibers, subtle offset alignment, and soft shallow shadows.
Use one dominant topic-specific visual metaphor supported by no more than 1-2 secondary medical, botanical, nutrition, metabolic, or lifestyle symbols.
Make each image feel specific to its article: vary the main silhouette, scale, negative-space pattern, and object family from post to post.
Maintain the focused simplicity of the approved portrait set: one large readable object family, bold paper silhouettes, sparse details, and generous cream/off-white negative space.
Use the visual brief as a menu of possible motifs, not a checklist. Choose the single strongest metaphor and leave out the rest.
Avoid filling the frame. Do not create busy symbol fields, scattered confetti, dense bead paths, or many small objects.
Keep the lower-right signature zone visually quiet.
Palette: off-white #FAF7F7, cream #EEE8E7, beige #BE9F90, medium brown #795A4A, dark brown #3C1A18, dark terracotta #6F2E0F, and one restrained lilac #DBC7F1 accent.
Avoid large lilac backgrounds, bright colors, gradients, glossy rendering, photorealism, generic stock wellness imagery, people, faces, bodies, hands, cartoon mascots, gore, fear-based medical imagery, tiny repeated dot networks, dense all-over medical-symbol patterns, text, letters, words, numbers, logos, and watermarks.
Output: finished editorial illustration only, no text, no words, no numbers, no captions, no logo, no watermark.
```

The image model must not generate the `Robin Berzin MD` mark. The deterministic
post-processor overlays it from `public/logo/RobinBerzin-Logo-DarkBrown-T.png`.

## Article Inputs

Replace these fields from article JSON or the hosted app form:

```text
Article title: {{title}}
Article excerpt: {{excerpt}}
Category: {{category}}
Tags: {{tags}}
Article body signals: {{body_signals}}
Visual brief: Build the image around {{visual_brief}}.
```

`visual_brief` is intentionally broad. The generation prompt must instruct the
model to choose one strong metaphor, not illustrate every motif.

## Portrait Format Block

Append this for portrait generation:

```text
Format: vertical 4:5 Instagram feed illustration, generated at 1024x1536 and cropped to 1080x1350 for Instagram feed posts, on-site cards, and article hero display.
Composition: stack the concept vertically with one bold central topic metaphor in the middle third and secondary symbols radiating above and below it.
The image must read instantly at phone-feed size: bold silhouettes, high figure-ground contrast, generous margins on all four edges.
Keep the lower-right signature zone visually quiet; no important detail in the bottom-right 20% x 14% area for deterministic RBMD logo overlay.
Safe area: keep all key elements inside the central 1080x1350 region; nothing critical in the top or bottom 8% of the canvas.
```

## Landscape Format Block

Append this for landscape generation:

```text
Format: horizontal editorial illustration, generated at 1536x1024 and cropped to 1200x630 for social link previews, og:image, Twitter cards, and Beehiiv email headers.
Composition: re-stage the same simple central metaphor as a native wide scene. Use one large hero object or object group offset left or right of center, plus only 1-2 small supporting shapes.
Do not simply widen a portrait composition; design natively for the wide frame while keeping the same cut-paper collage concept, palette, paper texture, and topic metaphor.
Keep the approved portrait-set simplicity: broad shapes, large quiet background fields, minimal detail, and immediate readability from a distance.
Do not spread many symbols across the width just because the canvas is wide.
The image must survive a center crop to 1.91:1: keep every important element inside the central 1536x806 band, with nothing critical in the top or bottom 11% of the canvas.
Bold thumbnail readability at 500px wide for iMessage, Slack, X, and email previews.
Keep the lower-right signature zone visually quiet; no important detail in the bottom-right 20% x 14% area for deterministic RBMD logo overlay.
```

## Consistency Guidance

Best result:

1. Generate the portrait first.
2. Use the approved portrait as a visual reference for landscape.
3. Ask for a native landscape re-stage of the same simple concept, not a widened
   crop.

Fallback when reference-image generation is unavailable:

1. Use the same title, excerpt, category, tags, and visual brief.
2. Preserve the same primary metaphor.
3. Reduce supporting elements further for landscape if the output gets busy.

## Post-Processing Contract

Portrait:

```text
crop/resize to 1080x1350
overlay Robin Berzin MD wordmark
write WebP to public/images/articles/rbmd-instagram-cut-paper-v1/<slug>.webp
```

Landscape:

```text
center-crop/resize to 1200x630
overlay Robin Berzin MD wordmark
write WebP to public/images/articles/rbmd-cut-paper-v1/<slug>.webp
```

The article template uses landscape files as `og:image` when present and declares
them as `1200x630`.

