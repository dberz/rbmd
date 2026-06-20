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
  const urls = [
    ...staticPaths.map((path) => `${base}/${path ? `${path}/` : ""}`),
    ...articles.map((item) => `${base}/${item.data.slug}/`),
    ...categories.map((item) => `${base}/category/${item.data.slug}/`),
    ...tags.map((item) => `${base}/tag/${item.data.slug}/`),
    ...courses.map((item) => `${base}/course/${item.data.slug}/`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
