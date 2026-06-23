#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "src/content/articles");
const WORKFLOW_DIR = path.join(ROOT, "image-generation/rbmd-editorial-cut-paper-v1");
const PROMPTS_DIR = path.join(WORKFLOW_DIR, "prompts");
const RAW_DIR = path.join(WORKFLOW_DIR, "raw");
const DEFAULT_MANIFEST = path.join(WORKFLOW_DIR, "manifest.json");
const DEFAULT_OUT_DIR = path.join(ROOT, "public/images/articles/generated-preview/rbmd-cut-paper-v1");
const DEFAULT_WEB_DIR = "/images/articles/generated-preview/rbmd-cut-paper-v1";
const WIDTH = 1536;
const HEIGHT = 1024;

const SAMPLE_SLUGS = [
  "protein-powder-guide-complete-protein",
  "vaginal-estrogen-prevention-longevity",
  "glp-1-libido-motivation-brain",
  "normal-labs-fatigue-root-causes",
  "bone-loss-inflammation-gut-health",
  "adhd-women-hormones-perimenopause-diagnosis",
  "fertility-over-35-protocol",
  "mitochondira-for-longevity",
  "metabolism-mental-health-protocol",
  "mold-symptoms",
  "healthy-protein-bar-guide",
  "how-do-you-actually-know-your-heart-is-healthy",
];

const STYLE_PROMPT = `RBMD Editorial Cut-Paper Collage v1.
Create sophisticated paper-cut editorial collage art for Robin Berzin MD article imagery.
The art direction borrows the idea of witty, topic-led newsletter illustration, but the final tone must be calmer, more premium, and medically credible.
Use flat layered cut-paper forms, deckled edges, matte paper fibers, subtle offset alignment, and soft shallow shadows.
Keep the composition bold enough for a 4:3 article card thumbnail and refined enough for a 3:2 article hero.
Use one central visual metaphor supported by 3-6 secondary medical, botanical, nutrition, metabolic, or lifestyle symbols.
Use generous negative space and keep the lower-right signature zone visually quiet.
Palette: off-white #FAF7F7, cream #EEE8E7, beige #BE9F90, medium brown #795A4A, dark brown #3C1A18, dark terracotta #6F2E0F, and one restrained lilac #DBC7F1 accent.
Avoid large lilac backgrounds, bright colors, gradients, glossy rendering, photorealism, generic stock wellness imagery, people, faces, bodies, hands, cartoon mascots, gore, fear-based medical imagery, text, letters, words, numbers, logos, and watermarks.`;

function usage() {
  console.log(`Usage:
  npm run images:plan -- [--slugs a,b,c] [--limit 12] [--all]
  npm run images:generate -- [--slugs a,b,c] [--limit 3]
  npm run images:process -- --slug article-slug --input /path/to/generated.png
  npm run images:sheet
  npm run images:approve -- --slugs a,b,c
  npm run images:apply -- [--status approved]

Environment for generate:
  OPENAI_API_KEY required
  OPENAI_IMAGE_MODEL optional, default gpt-image-2
  OPENAI_IMAGE_SIZE optional, default 1536x1024
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function ensureDirs() {
  await fs.mkdir(WORKFLOW_DIR, { recursive: true });
  await fs.mkdir(PROMPTS_DIR, { recursive: true });
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(DEFAULT_OUT_DIR, { recursive: true });
}

function splitSlugs(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number.parseInt(num, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-");
}

function htmlToText(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(html) {
  const headings = [];
  const re = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = re.exec(html))) {
    const heading = htmlToText(match[1]);
    if (heading) headings.push(heading);
  }
  return headings.slice(0, 10);
}

async function readArticles() {
  const files = (await fs.readdir(ARTICLES_DIR)).filter((file) => file.endsWith(".json"));
  const articles = [];
  for (const file of files) {
    const fullPath = path.join(ARTICLES_DIR, file);
    const data = JSON.parse(await fs.readFile(fullPath, "utf8"));
    articles.push({ file, fullPath, data });
  }
  return articles.sort((a, b) => Date.parse(b.data.date) - Date.parse(a.data.date));
}

function includesAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function buildVisualBrief(article, headings, bodyText) {
  const tags = (article.tags || []).map((tag) => tag.name).join(" ");
  const haystacks = [
    { text: `${article.title} ${article.excerpt || ""}`.toLowerCase(), weight: 5 },
    { text: `${article.categories?.[0]?.name || ""} ${tags}`.toLowerCase(), weight: 4 },
    { text: headings.join(" ").toLowerCase(), weight: 3 },
    { text: bodyText.slice(0, 2200).toLowerCase(), weight: 1 },
  ];

  const motifRules = [
    {
      needles: ["protein", "muscle", "vo2", "exercise", "resistance", "creatine"],
      motif: "protein blocks, muscle-fiber ribbons, strength arcs, and movement lines",
    },
    {
      needles: ["glp-1", "ozempic", "blood sugar", "glucose", "metabolic", "metabolism", "insulin", "cgm"],
      motif: "glucose bead paths, metabolic curves, mitochondria ovals, and appetite-signal rings",
    },
    {
      needles: ["estrogen", "hormone", "perimenopause", "menopause", "testosterone", "hrt", "cortisol", "fertility", "vaginal"],
      motif: "hormone cycle rings, endocrine signal dots, moon-phase arcs, and soft botanical seed forms",
    },
    {
      needles: ["brain", "mood", "adhd", "mental", "anxiety", "stress", "vagus", "neuro", "sleep", "fatigue"],
      motif: "brain contour shapes, neural pathways, calm signal waves, and sleep-rhythm arcs",
    },
    {
      needles: ["gut", "microbiome", "butyrate", "sibo", "fiber", "bloating", "inflammation"],
      motif: "gut-loop ribbons, microbiome dots, fiber strands, and inflammation sparks softened into paper shapes",
    },
    {
      needles: ["lab", "test", "dexa", "mri", "scan", "biological age", "preventative", "heart"],
      motif: "lab-vial silhouettes, diagnostic rings, scan-window shapes, and precise measurement ticks without numbers",
    },
    {
      needles: ["toxin", "mold", "mycotoxin", "microplastic", "seed oil", "processed", "deli", "olive oil", "alcohol"],
      motif: "filtered droplet shapes, caution triangles abstracted into soft paper, food-source icons, and detox pathway lines",
    },
    {
      needles: ["bone", "density", "osteoporosis"],
      motif: "bone-density lattice shapes, mineral dots, collagen ribbons, and gut-bone connection arcs",
    },
    {
      needles: ["longevity", "aging", "age", "mitochondria", "plasmapheresis", "immune"],
      motif: "cellular age rings, mitochondria, renewal arrows, immune-cell dots, and longevity tree-ring forms",
    },
    {
      needles: ["nutrition", "snack", "bar", "powder", "diet", "fasting", "olive", "food"],
      motif: "whole-food silhouettes, ingredient tiles, bowl and scoop forms, and nutrition label motifs without text",
    },
  ];

  const scored = motifRules
    .map((rule) => {
      const score = haystacks.reduce((total, haystack) => (includesAny(haystack.text, rule.needles) ? total + haystack.weight : total), 0);
      return { ...rule, score };
    })
    .filter((rule) => rule.score >= 3)
    .sort((a, b) => b.score - a.score);

  const motifs = scored.map((rule) => rule.motif);
  if (motifs.length === 0) {
    motifs.push("abstract body-system pathways, botanical medicine symbols, and calm diagnostic shapes");
  }

  return motifs.slice(0, 4).join("; ");
}

function compactText(value, limit) {
  const text = String(value || "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function buildPrompt(article) {
  const headings = extractHeadings(article.contentHtml || "");
  const bodyText = htmlToText(article.contentHtml || "");
  const category = article.categories?.[0]?.name || "Uncategorized";
  const tags = (article.tags || []).map((tag) => tag.name);
  const visualBrief = buildVisualBrief(article, headings, bodyText);
  const prompt = `Use case: stylized-concept
Asset type: Robin Berzin MD article image, generated at 1536x1024 for both 4:3 cards and 3:2 article hero cropping
Article title: ${article.title}
Article excerpt: ${article.excerpt || ""}
Category: ${category}
Tags: ${tags.join(", ")}
Article body signals: ${compactText([...headings, bodyText].join(" | "), 1700)}
Visual brief: Build the image around ${visualBrief}.
Style system: ${STYLE_PROMPT}
Composition: one bold central topic metaphor, asymmetric balance, strong thumbnail readability, generous margins, quiet lower-right signature zone, no important detail in the bottom-right 20% x 14% area.
Output: finished editorial illustration only, no text, no words, no numbers, no captions, no logo, no watermark.`;

  return {
    prompt,
    headings,
    bodySignals: compactText([...headings, bodyText].join(" | "), 1700),
    visualBrief,
  };
}

function selectArticles(articles, args) {
  const slugMap = new Map(articles.map((article) => [article.data.slug, article]));
  const requestedSlugs = splitSlugs(args.slugs || args.slug);

  if (requestedSlugs.length > 0) {
    return requestedSlugs.map((slug) => {
      const article = slugMap.get(slug);
      if (!article) throw new Error(`Unknown article slug: ${slug}`);
      return article;
    });
  }

  if (args.all) return articles;

  const limit = Number.parseInt(args.limit || "12", 10);
  const sample = SAMPLE_SLUGS.map((slug) => slugMap.get(slug)).filter(Boolean);
  return sample.slice(0, limit);
}

async function readManifest(manifestPath = DEFAULT_MANIFEST) {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        styleVersion: "rbmd-editorial-cut-paper-v1",
        imageSize: { width: WIDTH, height: HEIGHT },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };
    }
    throw error;
  }
}

async function writeManifest(manifest, manifestPath = DEFAULT_MANIFEST) {
  manifest.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function mergeItems(existingItems, newItems) {
  const bySlug = new Map(existingItems.map((item) => [item.slug, item]));
  for (const item of newItems) {
    bySlug.set(item.slug, { ...bySlug.get(item.slug), ...item });
  }
  return [...bySlug.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

async function plan(args) {
  await ensureDirs();
  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const outDir = path.resolve(ROOT, args["out-dir"] || DEFAULT_OUT_DIR);
  const webDir = args["web-dir"] || DEFAULT_WEB_DIR;
  const manifest = await readManifest(manifestPath);
  const articles = selectArticles(await readArticles(), args);

  const items = [];
  for (const article of articles) {
    const built = buildPrompt(article.data);
    const slug = article.data.slug;
    const promptPath = path.join(PROMPTS_DIR, `${slug}.txt`);
    await fs.writeFile(promptPath, `${built.prompt}\n`);
    items.push({
      slug,
      title: article.data.title,
      date: article.data.date,
      category: article.data.categories?.[0]?.name || "Uncategorized",
      tags: (article.data.tags || []).map((tag) => tag.name),
      sourceImage: article.data.image?.src || null,
      sourceArticleFile: path.relative(ROOT, article.fullPath),
      styleVersion: "rbmd-editorial-cut-paper-v1",
      status: "planned",
      promptPath: path.relative(ROOT, promptPath),
      rawImage: null,
      finalImage: path.relative(ROOT, path.join(outDir, `${slug}.webp`)),
      finalWebPath: `${webDir}/${slug}.webp`,
      visualBrief: built.visualBrief,
      bodySignals: built.bodySignals,
      prompt: built.prompt,
    });
  }

  manifest.items = mergeItems(manifest.items, items);
  await writeManifest(manifest, manifestPath);
  console.log(`Planned ${items.length} article image prompts.`);
  console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
  console.log(`Prompts: ${path.relative(ROOT, PROMPTS_DIR)}`);
}

function filterManifestItems(manifest, args, allowedStatuses = null) {
  const requestedSlugs = splitSlugs(args.slugs || args.slug);
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null;
  let items = manifest.items;
  if (requestedSlugs.length > 0) {
    const wanted = new Set(requestedSlugs);
    items = items.filter((item) => wanted.has(item.slug));
  }
  if (allowedStatuses) {
    const statuses = new Set(allowedStatuses);
    items = items.filter((item) => statuses.has(item.status));
  }
  if (limit) items = items.slice(0, limit);
  return items;
}

async function callImagesApi(prompt, args) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for npm run images:generate.");

  const body = {
    model: args.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    prompt,
    size: args.size || process.env.OPENAI_IMAGE_SIZE || `${WIDTH}x${HEIGHT}`,
    response_format: "b64_json",
  };

  if (args.quality || process.env.OPENAI_IMAGE_QUALITY) {
    body.quality = args.quality || process.env.OPENAI_IMAGE_QUALITY;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Images API failed (${response.status}): ${await response.text()}`);
  }

  const json = await response.json();
  const image = json.data?.[0];
  if (!image) throw new Error("Images API returned no image data.");

  if (image.b64_json) {
    return Buffer.from(image.b64_json, "base64");
  }

  if (image.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) throw new Error(`Image download failed (${imageResponse.status}).`);
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error("Images API response did not include b64_json or url.");
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    throw new Error("The image workflow requires sharp. Install it with: npm install --save-dev sharp");
  }
}

async function logoBuffer(sharp, width = 220) {
  const logoPath = path.join(ROOT, "public/logo/RobinBerzin-Logo-DarkBrown-T.png");
  return sharp(logoPath).resize({ width }).png().toBuffer();
}

async function processImage({ inputPath, outputPath, withLogo = true }) {
  const sharp = await loadSharp();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let image = sharp(inputPath).resize(WIDTH, HEIGHT, {
    fit: "cover",
    position: "center",
  });

  if (withLogo) {
    const logo = await logoBuffer(sharp);
    image = image.composite([
      {
        input: logo,
        gravity: "southeast",
        left: WIDTH - 220 - 54,
        top: HEIGHT - 70,
      },
    ]);
  }

  await image.webp({ quality: 92, effort: 5 }).toFile(outputPath);
}

async function generate(args) {
  await ensureDirs();
  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const items = filterManifestItems(manifest, args, ["planned", "failed"]);

  if (items.length === 0) {
    console.log("No planned images to generate.");
    return;
  }

  for (const item of items) {
    console.log(`Generating ${item.slug}...`);
    try {
      const imageBuffer = await callImagesApi(item.prompt, args);
      const rawPath = path.join(RAW_DIR, `${item.slug}.png`);
      await fs.writeFile(rawPath, imageBuffer);
      item.rawImage = path.relative(ROOT, rawPath);
      item.status = "raw-generated";

      const outputPath = path.join(ROOT, item.finalImage);
      await processImage({ inputPath: rawPath, outputPath, withLogo: !args["no-logo"] });
      item.status = "generated";
      item.generatedAt = new Date().toISOString();
      console.log(`Generated ${item.finalImage}`);
      await writeManifest(manifest, manifestPath);
    } catch (error) {
      item.status = "failed";
      item.error = error.message;
      await writeManifest(manifest, manifestPath);
      throw error;
    }
  }
}

async function processLocal(args) {
  await ensureDirs();
  const slug = args.slug;
  const input = args.input;
  if (!slug || !input) throw new Error("images:process requires --slug and --input.");

  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const item = manifest.items.find((entry) => entry.slug === slug);
  if (!item) throw new Error(`No manifest item for slug: ${slug}. Run images:plan first.`);

  const inputPath = path.resolve(ROOT, input);
  const rawPath = path.join(RAW_DIR, `${slug}.png`);
  await fs.copyFile(inputPath, rawPath);
  item.rawImage = path.relative(ROOT, rawPath);

  const outputPath = path.join(ROOT, item.finalImage);
  await processImage({ inputPath: rawPath, outputPath, withLogo: !args["no-logo"] });
  item.status = "generated";
  item.generatedAt = new Date().toISOString();
  await writeManifest(manifest, manifestPath);
  console.log(`Processed ${path.relative(ROOT, inputPath)} -> ${item.finalImage}`);
}

async function approve(args) {
  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const items = filterManifestItems(manifest, args);
  if (items.length === 0) throw new Error("No manifest items matched.");
  for (const item of items) {
    if (!item.finalImage) throw new Error(`${item.slug} has no finalImage.`);
    item.status = "approved";
    item.approvedAt = new Date().toISOString();
  }
  await writeManifest(manifest, manifestPath);
  console.log(`Approved ${items.length} image(s).`);
}

async function contactSheet(args) {
  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const items = filterManifestItems(manifest, args);
  const cards = items
    .map((item) => {
      const imagePath = item.finalImage ? path.relative(WORKFLOW_DIR, path.join(ROOT, item.finalImage)) : "";
      return `<article>
  <div class="media">${imagePath ? `<img src="${imagePath}" alt="">` : ""}</div>
  <span>${item.status}</span>
  <h2>${escapeHtml(item.title)}</h2>
  <p>${escapeHtml(item.category)}</p>
  <p>${escapeHtml(item.visualBrief || "")}</p>
</article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RBMD Cut-Paper Article Image Review</title>
<style>
  body { margin: 0; background: #FAF7F7; color: #3C1A18; font-family: Helvetica, Arial, sans-serif; }
  main { padding: 32px; }
  h1 { font-family: Georgia, serif; font-size: 34px; font-weight: 400; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
  article { background: #EEE8E7; padding: 12px; }
  .media { aspect-ratio: 4 / 3; background: #BE9F90; overflow: hidden; margin-bottom: 12px; }
  .media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  span { display: inline-block; background: #DBC7F1; border-radius: 999px; font-size: 11px; padding: 4px 8px; text-transform: uppercase; }
  h2 { font-family: Georgia, serif; font-size: 19px; font-weight: 400; line-height: 1.2; margin: 10px 0 6px; }
  p { color: #795A4A; font-size: 13px; line-height: 1.45; margin: 6px 0; }
</style>
</head>
<body>
<main>
<h1>RBMD Cut-Paper Article Image Review</h1>
<section class="grid">
${cards}
</section>
</main>
</body>
</html>
`;

  const sheetPath = path.join(WORKFLOW_DIR, "contact-sheet.html");
  await fs.writeFile(sheetPath, html);
  console.log(`Contact sheet: ${path.relative(ROOT, sheetPath)}`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function applyApproved(args) {
  const manifestPath = path.resolve(ROOT, args.manifest || DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const status = args.status || "approved";
  const items = filterManifestItems(manifest, args, [status]);
  if (items.length === 0) {
    console.log(`No ${status} images to apply.`);
    return;
  }

  const articleMap = new Map((await readArticles()).map((article) => [article.data.slug, article]));
  for (const item of items) {
    const article = articleMap.get(item.slug);
    if (!article) throw new Error(`Missing article for slug: ${item.slug}`);
    article.data.image = {
      src: item.finalWebPath,
      alt: article.data.image?.alt || `${article.data.title} editorial cut-paper collage illustration`,
      width: WIDTH,
      height: HEIGHT,
    };
    await fs.writeFile(article.fullPath, `${JSON.stringify(article.data, null, 2)}\n`);
    item.appliedAt = new Date().toISOString();
    item.status = "applied";
    console.log(`Updated ${article.file}`);
  }
  await writeManifest(manifest, manifestPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.help) {
    usage();
    return;
  }

  switch (args.command) {
    case "plan":
      await plan(args);
      break;
    case "generate":
      await generate(args);
      break;
    case "process":
      await processLocal(args);
      break;
    case "sheet":
      await contactSheet(args);
      break;
    case "approve":
      await approve(args);
      break;
    case "apply":
      await applyApproved(args);
      break;
    default:
      throw new Error(`Unknown command: ${args.command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
