import { getCollection, getEntry } from "astro:content";

const primaryCategorySlugs = new Set([
  "brain-mood-nervous-system",
  "fertility-parenting-robin-berzin-md",
  "longevity-metabolic-health",
  "toxins-nutrition-modern-exposures",
  "womens-health-hormones",
]);

export async function getArticles() {
  const articles = await getCollection("articles");
  return articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getFeaturedArticles(limit = 6) {
  const articles = await getArticles();
  return articles.slice(0, limit);
}

export async function getCategories() {
  const categories = await getCollection("categories");
  return categories.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function getPrimaryCategories() {
  const categories = await getCategories();
  return categories.filter((category) => primaryCategorySlugs.has(category.data.slug));
}

export async function getTags() {
  const tags = await getCollection("tags");
  return tags.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function getCourses() {
  const courses = await getCollection("courses");
  return courses.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getPage(slug: string) {
  return getEntry("pages", slug);
}

export async function getDefaultLeadMagnet() {
  return getEntry("leadMagnets", "female-longevity-supplement-stack");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function articleUrl(slug: string) {
  return `/${slug}/`;
}

export function categoryUrl(slug: string) {
  return `/category/${slug}/`;
}

export function tagUrl(slug: string) {
  return `/tag/${slug}/`;
}

export function plainText(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
