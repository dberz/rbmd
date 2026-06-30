import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const base = "https://robinberzinmd.com";
  const articles = await getCollection("articles");
  const categories = await getCollection("categories");
  const tags = await getCollection("tags");
  const courses = await getCollection("courses");
  const staticPaths = [
    "",
    "about",
    "articles",
    "courses",
    "book",
    "contact",
    "media",
    "newsletter",
    "parsley-health",
    "terms-of-use",
    "disclaimer",
  ];
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  // Most recent article modified date — used as lastmod for the article-index
  // and category/tag listing pages, which change whenever a post is added/edited.
  const newest = articles.reduce(
    (max, a) => {
      const t = (a.data.modified ?? a.data.date).getTime();
      return t > max ? t : max;
    },
    0
  );
  const newestDate = newest ? iso(new Date(newest)) : undefined;

  type Entry = { loc: string; lastmod?: string };
  const entries: Entry[] = [
    ...staticPaths.map((path) => ({
      loc: `${base}/${path ? `${path}/` : ""}`,
      lastmod: ["", "articles", "courses"].includes(path) ? newestDate : undefined,
    })),
    ...articles.map((item) => ({
      loc: `${base}/${item.data.slug}/`,
      lastmod: iso(item.data.modified ?? item.data.date),
    })),
    ...categories.map((item) => ({ loc: `${base}/category/${item.data.slug}/`, lastmod: newestDate })),
    ...tags.map((item) => ({ loc: `${base}/tag/${item.data.slug}/`, lastmod: newestDate })),
    ...courses.map((item) => ({ loc: `${base}/course/${item.data.slug}/` })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(({ loc, lastmod }) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
