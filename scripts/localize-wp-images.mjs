// Localize legacy WordPress media.
//
// Article/course/page bodies were migrated from WordPress with inline images
// still pointing at https://robinberzinmd.com/wp-content/uploads/... — URLs
// that die the moment this build replaces WordPress on the domain. This script:
//   1. scans src/content/{articles,courses,pages}/*.json for wp-content URLs,
//   2. downloads each unique file into public/images/legacy/<year>/<month>/,
//   3. rewrites ONLY the URL strings (src/srcset/href) — article copy untouched.
//
// Safe to re-run: existing downloads are skipped, and rewriting is idempotent.
// A URL is only rewritten if its file downloaded successfully.
//
// Usage: node scripts/localize-wp-images.mjs [--dry-run]

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIRS = ["src/content/articles", "src/content/courses", "src/content/pages"];
const LEGACY_DIR = join(ROOT, "public/images/legacy");
const URL_RE = /https?:\/\/(?:www\.)?robinberzinmd\.com\/wp-content\/uploads\/([^"'\\<>(),\s]+)/g;
const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 6;

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  if (await exists(dest)) return "cached";
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error("empty response");
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return `${Math.round(buf.length / 1024)}K`;
}

// ---- 1. Scan -----------------------------------------------------------------
const files = [];
for (const dir of CONTENT_DIRS) {
  for (const f of await readdir(join(ROOT, dir))) {
    if (f.endsWith(".json")) files.push(join(ROOT, dir, f));
  }
}

const urls = new Map(); // full URL -> relative upload path
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const m of text.matchAll(URL_RE)) urls.set(m[0], m[1]);
}
console.log(`Found ${urls.size} unique wp-content URLs across ${files.length} content files.`);

// ---- 2. Download -------------------------------------------------------------
const ok = new Set();
const failed = new Map();
const queue = [...urls.entries()];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const [url, rel] = queue.shift();
      const dest = join(LEGACY_DIR, rel);
      if (DRY_RUN) {
        console.log(`[dry] ${url} -> public/images/legacy/${rel}`);
        ok.add(url);
        continue;
      }
      try {
        const result = await download(url, dest);
        ok.add(url);
        console.log(`  ✓ ${rel} (${result})`);
      } catch (error) {
        failed.set(url, String(error.message ?? error));
        console.error(`  ✗ ${rel}: ${error.message ?? error}`);
      }
    }
  })
);

// ---- 3. Rewrite --------------------------------------------------------------
let rewrittenFiles = 0;
for (const file of files) {
  const text = await readFile(file, "utf8");
  const next = text.replace(URL_RE, (full, rel) => (ok.has(full) ? `/images/legacy/${rel}` : full));
  if (next !== text) {
    rewrittenFiles += 1;
    if (!DRY_RUN) await writeFile(file, next);
  }
}

console.log(`\nDownloaded/cached: ${ok.size}  Failed: ${failed.size}  Files rewritten: ${rewrittenFiles}${DRY_RUN ? " (dry run)" : ""}`);
if (failed.size) {
  console.error("\nFailed URLs (left untouched in content — re-run or fix manually):");
  for (const [url, reason] of failed) console.error(`  ${url}  [${reason}]`);
  process.exitCode = 1;
}
