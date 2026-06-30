import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { plainText } from "@lib/content";

export const prerender = true;

// Full-text export for answer engines (the richer companion to /llms.txt).
// One clean, attributable plain-text block per article so LLMs can quote Robin
// accurately with a source URL.
export const GET: APIRoute = async () => {
  const base = "https://robinberzinmd.com";
  const articles = (await getCollection("articles")).sort(
    (a, b) => (b.data.modified ?? b.data.date).getTime() - (a.data.modified ?? a.data.date).getTime()
  );

  const header = [
    "# Robin Berzin, MD — Full Content Export",
    "",
    "> Evidence-based, physician-written guidance for women on hormones, metabolism,",
    "> longevity, fertility, nutrition, toxins, and brain health. Author and reviewer:",
    "> Robin Berzin, MD (Columbia University; Internal Medicine, Mount Sinai).",
    "> Educational only — not a substitute for professional medical advice.",
    "",
    `> Source: ${base}/ · Index: ${base}/llms.txt`,
    "",
    "---",
    "",
  ].join("\n");

  const body = articles
    .map((a) => {
      const url = `${base}/${a.data.slug}/`;
      const updated = (a.data.modified ?? a.data.date).toISOString().slice(0, 10);
      const cats = a.data.categories.map((c) => c.name).join(", ");
      const text = plainText(a.data.contentHtml);
      return [
        `## ${a.data.title}`,
        `URL: ${url}`,
        `Updated: ${updated}${cats ? ` · Topics: ${cats}` : ""}`,
        a.data.excerpt ? `Summary: ${a.data.excerpt}` : "",
        "",
        text,
        "",
        "---",
        "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return new Response(header + body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
