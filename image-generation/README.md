# RBMD Image Generation

This folder documents and stores the article image workflow for Robin Berzin MD.

## Current Production Workflow

Use this doc for day-to-day generation, review, processing, and approval:

- `rbmd-editorial-cut-paper-v1/README.md`

That workflow covers:

- Codex-assisted generation without a local shell API key.
- Programmatic generation through `npm run images:generate`.
- Portrait and landscape output paths.
- Review sheets, approval, and article JSON application.
- The deterministic `Robin Berzin MD` wordmark overlay.

## Prompt Contract

Use this doc when editing the prompt strategy or implementing the future hosted
API app:

- `rbmd-dual-format-prompt.md`

The executable source of truth remains:

- `../scripts/rbmd-article-images.mjs`

If the docs and script diverge, update the docs to match the script or update
the script and then rerun:

```bash
npm run images:plan -- --all
```

## Production Asset Paths

Portrait finals:

```text
public/images/articles/rbmd-instagram-cut-paper-v1/<slug>.webp
```

Landscape finals:

```text
public/images/articles/rbmd-cut-paper-v1/<slug>.webp
```

Do not commit rejected test images, raw scratch images, `.DS_Store`, or duplicate
backup folders such as `public/images/articles v1/`.

