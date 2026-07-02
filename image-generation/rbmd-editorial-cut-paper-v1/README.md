# RBMD Editorial Cut-Paper Article Images

This is the source-of-truth workflow for Robin Berzin MD article imagery in the
approved editorial cut-paper style.

The system supports two execution modes:

- Codex-assisted generation: use the built-in image tool in a Codex session,
  then import the selected PNG through this repo's processor.
- API generation: use `npm run images:generate` locally or from the eventual
  hosted app. This requires `OPENAI_API_KEY`.

Both modes use the same prompt files, post-processing, logo overlay, output
paths, and review process.

## Style Lock

- Style name: `RBMD Editorial Cut-Paper Collage v1`.
- Medium: flat layered cut-paper collage with deckled edges, matte fibers,
  subtle offset alignment, and soft shallow shadows.
- Tone: witty and topic-led, but calm, premium, adult, and medically credible.
- Palette: off-white, cream, beige, medium brown, dark brown, dark terracotta,
  and one restrained lilac accent.
- Composition: one strong topic-specific metaphor, 1-2 restrained supporting
  symbols at most, broad paper silhouettes, sparse detail, and generous
  cream/off-white negative space.
- Landscape images must not become busier because the canvas is wider. Re-stage
  the same simple metaphor natively for 1.91:1.
- Use the article visual brief as a menu, not a checklist. Choose the strongest
  metaphor and leave the rest out.
- The lower-right signature zone must stay visually quiet so the deterministic
  `Robin Berzin MD` wordmark remains legible after processing.

## Hard Rules

- Do not generate people, faces, bodies, hands, or AI-generated humans.
- Do not ask the image model to generate words, letters, numbers, captions,
  logos, or watermarks.
- Do not use large lilac backgrounds, bright colors, gradients, glossy 3D,
  photorealism, generic stock wellness imagery, fear-based medical imagery, or
  gore.
- Do not create dense symbol fields, scattered confetti, dense bead paths, or
  many small objects.
- Do not update live article JSON until images have been reviewed and approved.

## Formats

| Format | Generate at | Final asset | Used for |
| --- | --- | --- | --- |
| Portrait 4:5 | `1024x1536` | `1080x1350` WebP | Instagram feed post, on-site article cards, article hero |
| Landscape 1.91:1 | `1536x1024` | `1200x630` WebP | `og:image`, Twitter/X card, Beehiiv email header |

Never crop one final asset from the other. Portrait and landscape are separate,
native compositions of the same article concept.

## Output Paths

- Manifest: `image-generation/rbmd-editorial-cut-paper-v1/manifest.json`
- Portrait prompts: `image-generation/rbmd-editorial-cut-paper-v1/prompts/*.txt`
- Landscape prompts:
  `image-generation/rbmd-editorial-cut-paper-v1/prompts-landscape/*.txt`
- Portrait raw files: `image-generation/rbmd-editorial-cut-paper-v1/raw/*.png`
- Landscape raw files:
  `image-generation/rbmd-editorial-cut-paper-v1/raw-landscape/*.png`
- Portrait finals:
  `public/images/articles/rbmd-instagram-cut-paper-v1/<slug>.webp`
- Landscape finals:
  `public/images/articles/rbmd-cut-paper-v1/<slug>.webp`

The article template uses portrait images for on-site cards/heroes. When a
matching landscape file exists, the article template serves it as `og:image`
with `1200x630` metadata.

Do not commit scratch folders such as `public/images/articles v1/` or rejected
test outputs. Only commit approved finals in the production paths above.

`production-manifest.json` is a legacy archive from an earlier one-format image
pass. Do not use it for new generation. The active manifest is `manifest.json`,
and the active prompt source is `scripts/rbmd-article-images.mjs`.

## Shared Command Flow

Create or refresh prompt plans from article JSON:

```bash
npm run images:plan
npm run images:plan -- --slugs metabolism-mental-health-protocol,mold-symptoms
npm run images:plan -- --all
```

This writes or refreshes both prompt formats per article:

- `prompts/<slug>.txt`
- `prompts-landscape/<slug>.txt`

Create a local review sheet:

```bash
npm run images:sheet
open image-generation/rbmd-editorial-cut-paper-v1/contact-sheet.html
```

Approve reviewed images:

```bash
npm run images:approve -- --slugs metabolism-mental-health-protocol,mold-symptoms
```

Apply approved portrait paths to article JSON:

```bash
npm run images:apply
```

Validate before committing:

```bash
npm run build
```

## Codex-Assisted Workflow

Use this path when generating images inside a Codex session without a shell
`OPENAI_API_KEY`.

1. Run `npm run images:plan -- --all` or a scoped `--slugs` plan.
2. Open the relevant prompt file:
   - portrait: `prompts/<slug>.txt`
   - landscape: `prompts-landscape/<slug>.txt`
3. Generate with the built-in image tool. Stay faithful to the prompt; do not
   add extra motifs beyond the simplified style lock.
4. Copy the selected generated PNG path from the Codex generated image folder.
5. Import and process the image:

```bash
npm run images:process -- --slug metabolism-mental-health-protocol --format portrait --input /absolute/path/to/generated-portrait.png
npm run images:process -- --slug metabolism-mental-health-protocol --format landscape --input /absolute/path/to/generated-landscape.png
```

The processor crops/resizes, overlays `Robin Berzin MD` from
`public/logo/RobinBerzin-Logo-DarkBrown-T.png`, writes WebP, and updates the
manifest status for that format.

Codex image generation is useful for review and iteration, but it is less
repeatable than the API path because the generation step is not fully scripted.

## API Workflow

Use this path for local batch jobs and for the eventual hosted Vercel app.

Required environment:

```bash
OPENAI_API_KEY=...
```

Optional environment:

```bash
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=1536x1024
OPENAI_IMAGE_QUALITY=high
```

Generate both formats for planned items:

```bash
OPENAI_API_KEY=... npm run images:generate -- --limit 5
OPENAI_API_KEY=... npm run images:generate -- --slugs metabolism-mental-health-protocol --format both
```

Generate only one format:

```bash
OPENAI_API_KEY=... npm run images:generate -- --slugs metabolism-mental-health-protocol --format portrait
OPENAI_API_KEY=... npm run images:generate -- --slugs metabolism-mental-health-protocol --format landscape
```

Default generation format is `both`. The script calls the OpenAI Images API,
writes raw PNGs, processes finals, overlays the wordmark, and updates the
manifest.

## Hosted App Workflow

The hosted tool should be a thin UI over the same pipeline rules:

- Input: article title, excerpt/body, category, tags, slug, and optional manual
  visual brief override.
- Plan: reuse the same prompt builder logic as `scripts/rbmd-article-images.mjs`
  so team members do not hand-edit style prompts.
- Generate: create portrait and landscape as independent compositions.
- Review: show portrait and landscape side by side, with regenerate buttons per
  format.
- Approve: write approved finals to the production paths and record manifest
  metadata.
- Export: provide direct downloads for Instagram (`1080x1350`) and Beehiiv/OG
  (`1200x630`).

Vercel environment variables should include `OPENAI_API_KEY`. The key should
never be exposed to the browser; generation must run server-side.
