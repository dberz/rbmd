# RBMD Editorial Cut-Paper Article Images

This workflow generates consistent article images in the selected Style 2 direction:
editorial cut-paper collage, inspired by topic-led newsletter art but calmer, more premium, and aligned with Robin Berzin MD.

## Style Lock

- Format: `1536x1024`, usable as both a 4:3 card crop and 3:2 article hero crop.
- Medium: flat layered cut-paper collage with deckled edges, matte fibers, subtle offset, and shallow paper shadows.
- Tone: witty and topic-led, but medically credible, calm, adult, and premium.
- Palette: off-white, cream, beige, medium brown, dark brown, dark terracotta, and restrained lilac accent.
- Composition: one central visual metaphor plus 3-6 supporting medical, botanical, nutrition, metabolic, or lifestyle symbols.
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

Generate programmatically through the OpenAI Images API:

```bash
OPENAI_API_KEY=... npm run images:generate -- --limit 5
OPENAI_API_KEY=... OPENAI_IMAGE_MODEL=gpt-image-2 npm run images:generate -- --slugs metabolism-mental-health-protocol
```

Process a Codex-generated image into the same final asset format:

```bash
npm run images:process -- --slug metabolism-mental-health-protocol --input /absolute/path/to/generated.png
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
- Prompt files: `image-generation/rbmd-editorial-cut-paper-v1/prompts/*.txt`
- Raw generated files: `image-generation/rbmd-editorial-cut-paper-v1/raw/*.png`
- Preview final files: `public/images/articles/generated-preview/rbmd-cut-paper-v1/*.webp`

The preview output directory is intentionally separate from production article image paths.
