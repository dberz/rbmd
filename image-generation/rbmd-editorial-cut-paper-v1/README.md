# RBMD Editorial Cut-Paper Article Images

This workflow generates consistent article images in the selected Style 2 direction:
editorial cut-paper collage, inspired by topic-led newsletter art but calmer, more premium, and aligned with Robin Berzin MD.

## Style Lock

- Portrait format: generate at `1024x1536`, crop/process to `1080x1350`.
- Landscape format: generate at `1536x1024`, center-crop/process to `1200x630`.
- Never crop one final from the other. Create two native compositions from the same concept.
- Medium: flat layered cut-paper collage with deckled edges, matte fibers, subtle offset, and shallow paper shadows.
- Tone: witty and topic-led, but medically credible, calm, adult, and premium.
- Palette: off-white, cream, beige, medium brown, dark brown, dark terracotta, and restrained lilac accent.
- Composition: keep the current approved portrait-set simplicity: one strong topic-specific metaphor, 1-2 restrained supporting symbols at most, broad paper silhouettes, generous cream/off-white negative space, and a quiet lower-right signature zone.
- Landscape compositions must not become busier just because the canvas is wider. Re-stage the same simple metaphor natively for 1.91:1 with one large hero object or object group and sparse supporting detail.
- Signature zone: keep the lower-right quiet so the deterministic RBMD logo overlay stays legible.

## Hard Rules

- No people, faces, bodies, hands, or AI-generated humans.
- No generated words, letters, numbers, captions, logos, or watermarks.
- No large lilac backgrounds.
- No gradients, glossy 3D, photorealism, stock wellness imagery, fear-based medical imagery, or gore.
- Do not update live article JSON until images have been reviewed and approved.

## Commands

Create or refresh prompt plans from article JSON:

```bash
npm run images:plan
npm run images:plan -- --slugs metabolism-mental-health-protocol,mold-symptoms
npm run images:plan -- --all
```

`images:plan` now writes two independent prompts per article:

- Portrait prompt: `image-generation/rbmd-editorial-cut-paper-v1/prompts/<slug>.txt`
- Landscape prompt: `image-generation/rbmd-editorial-cut-paper-v1/prompts-landscape/<slug>.txt`

Generate programmatically through the OpenAI Images API:

```bash
OPENAI_API_KEY=... npm run images:generate -- --limit 5
OPENAI_API_KEY=... OPENAI_IMAGE_MODEL=gpt-image-2 npm run images:generate -- --slugs metabolism-mental-health-protocol
OPENAI_API_KEY=... npm run images:generate -- --slugs metabolism-mental-health-protocol --format portrait
OPENAI_API_KEY=... npm run images:generate -- --slugs metabolism-mental-health-protocol --format landscape
```

Default generation format is `both`. The script generates portrait and landscape as separate native compositions from the same article concept.

Process a Codex-generated image into the same final asset format:

```bash
npm run images:process -- --slug metabolism-mental-health-protocol --format portrait --input /absolute/path/to/generated-portrait.png
npm run images:process -- --slug metabolism-mental-health-protocol --format landscape --input /absolute/path/to/generated-landscape.png
```

Create a local review sheet:

```bash
npm run images:sheet
open image-generation/rbmd-editorial-cut-paper-v1/contact-sheet.html
```

Approve reviewed images:

```bash
npm run images:approve -- --slugs metabolism-mental-health-protocol,mold-symptoms
```

Apply approved image paths to article JSON:

```bash
npm run images:apply
```

## Output Paths

- Prompt manifest: `image-generation/rbmd-editorial-cut-paper-v1/manifest.json`
- Portrait prompt files: `image-generation/rbmd-editorial-cut-paper-v1/prompts/*.txt`
- Landscape prompt files: `image-generation/rbmd-editorial-cut-paper-v1/prompts-landscape/*.txt`
- Portrait raw files: `image-generation/rbmd-editorial-cut-paper-v1/raw/*.png`
- Landscape raw files: `image-generation/rbmd-editorial-cut-paper-v1/raw-landscape/*.png`
- Portrait final files: `public/images/articles/rbmd-instagram-cut-paper-v1/*.webp`
- Landscape final files: `public/images/articles/rbmd-cut-paper-v1/*.webp`

The article template uses the portrait image for on-site cards/heroes. When a matching landscape file exists in `public/images/articles/rbmd-cut-paper-v1/`, it is used for `og:image` and Twitter card metadata.
