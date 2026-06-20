import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

const seo = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.url().optional(),
  noindex: z.boolean().optional(),
}).optional();

const image = z.object({
  src: z.string(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}).optional();

const taxonomyRef = z.object({
  slug: z.string(),
  name: z.string(),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    modified: z.coerce.date().optional(),
    excerpt: z.string().default(""),
    contentHtml: z.string(),
    categories: z.array(taxonomyRef).default([]),
    tags: z.array(taxonomyRef).default([]),
    image,
    author: z.string().default("Robin Berzin MD"),
    sourceUrl: z.url(),
    seo,
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    contentHtml: z.string().default(""),
    sourceUrl: z.url().optional(),
    seo,
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/categories" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().default(""),
    count: z.number().default(0),
    sourceUrl: z.url().optional(),
  }),
});

const tags = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/tags" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().default(""),
    count: z.number().default(0),
    sourceUrl: z.url().optional(),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/courses" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    price: z.string().optional(),
    status: z.string().optional(),
    partner: z.string().optional(),
    excerpt: z.string().default(""),
    contentHtml: z.string().default(""),
    sourceUrl: z.url().optional(),
    image,
    seo,
  }),
});

const podcasts = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/podcasts" }),
  schema: z.object({
    title: z.string(),
    outlet: z.string(),
    url: z.url(),
    embedUrl: z.url().optional(),
    summary: z.string(),
    category: z.string().default("Podcast"),
    featured: z.boolean().default(false),
  }),
});

const leadMagnets = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/leadMagnets" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    eyebrow: z.string().default("Free protocol"),
    description: z.string(),
    buttonText: z.string().default("Get the free protocol"),
    topics: z.array(z.string()).default([]),
  }),
});

const redirects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/redirects" }),
  schema: z.object({
    source: z.string(),
    destination: z.string(),
    permanent: z.boolean().default(true),
  }),
});

export const collections = {
  articles,
  pages,
  categories,
  tags,
  courses,
  podcasts,
  leadMagnets,
  redirects,
};
