import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const API = "https://robinberzinmd.com/wp-json/wp/v2";

const collections = {
  articles: join(ROOT, "src/content/articles"),
  pages: join(ROOT, "src/content/pages"),
  categories: join(ROOT, "src/content/categories"),
  tags: join(ROOT, "src/content/tags"),
  courses: join(ROOT, "src/content/courses"),
  redirects: join(ROOT, "src/content/redirects"),
};

const entityMap = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  ndash: "-",
  mdash: "-",
  hellip: "...",
};

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => entityMap[name] ?? `&${name};`);
}

function stripTags(value = "") {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?OptinMonster[\s\S]*?-->/gi, "")
    .replace(/<div id="om-[^"]+-holder"><\/div>/gi, "")
    .replace(/https:\/\/robinberzinmd\.com\/\?p=(\d+)/g, "https://robinberzinmd.com/")
    .trim();
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function resetGeneratedDir(path) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

async function writeJson(path, data) {
  await ensureDir(dirname(path));
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchAll(path, params = {}) {
  const output = [];
  let page = 1;
  for (;;) {
    const url = new URL(`${API}/${path}`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url);
    if (response.status === 400 && page > 1) break;
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} ${url}`);
    const data = await response.json();
    output.push(...data);
    const totalPages = Number(response.headers.get("x-wp-totalpages") || "1");
    if (page >= totalPages || data.length === 0) break;
    page += 1;
  }
  return output;
}

function taxonomyRef(ids = [], lookup) {
  return ids
    .map((id) => lookup.get(id))
    .filter(Boolean)
    .map((item) => ({ slug: item.slug, name: decodeEntities(item.name) }));
}

function featuredImage(item) {
  const media = item._embedded?.["wp:featuredmedia"]?.[0];
  if (!media?.source_url) return undefined;
  return {
    src: media.source_url,
    alt: decodeEntities(media.alt_text || item.title?.rendered || ""),
    width: media.media_details?.width,
    height: media.media_details?.height,
  };
}

async function writeTaxonomies(collectionName, items) {
  await resetGeneratedDir(collections[collectionName]);
  for (const item of items) {
    await writeJson(join(collections[collectionName], `${item.slug}.json`), {
      name: decodeEntities(item.name),
      slug: item.slug,
      description: stripTags(item.description || ""),
      count: item.count || 0,
      sourceUrl: item.link,
    });
  }
}

async function writeArticles(categories, tags) {
  const categoryLookup = new Map(categories.map((item) => [item.id, item]));
  const tagLookup = new Map(tags.map((item) => [item.id, item]));
  const posts = await fetchAll("posts", { _embed: "wp:featuredmedia" });
  await resetGeneratedDir(collections.articles);
  for (const post of posts) {
    const excerpt = stripTags(post.excerpt?.rendered || "");
    const data = {
      title: decodeEntities(post.title?.rendered || post.slug),
      slug: post.slug,
      date: post.date,
      modified: post.modified,
      excerpt,
      contentHtml: cleanHtml(post.content?.rendered || ""),
      categories: taxonomyRef(post.categories, categoryLookup),
      tags: taxonomyRef(post.tags, tagLookup),
      image: featuredImage(post),
      author: "Robin Berzin MD",
      sourceUrl: post.link,
      seo: {
        title: decodeEntities(post.title?.rendered || post.slug),
        description: excerpt.slice(0, 180),
        canonical: `https://robinberzinmd.com/${post.slug}/`,
      },
    };
    await writeJson(join(collections.articles, `${post.slug}.json`), data);
  }
  return posts;
}

async function writePages() {
  const pages = await fetchAll("pages");
  await resetGeneratedDir(collections.pages);
  for (const page of pages) {
    const slug = page.slug === "home" ? "home" : page.slug;
    await writeJson(join(collections.pages, `${slug}.json`), {
      title: decodeEntities(page.title?.rendered || slug),
      slug,
      contentHtml: cleanHtml(page.content?.rendered || ""),
      sourceUrl: page.link,
      seo: {
        title: decodeEntities(page.title?.rendered || slug),
        description: stripTags(page.excerpt?.rendered || page.content?.rendered || "").slice(0, 180),
        canonical: page.link,
      },
    });
  }
  return pages;
}

async function writeCourses() {
  await resetGeneratedDir(collections.courses);
  let courses = [];
  try {
    courses = await fetchAll("course", { _embed: "wp:featuredmedia" });
  } catch {
    courses = [];
  }

  if (courses.length) {
    for (const course of courses) {
      await writeJson(join(collections.courses, `${course.slug}.json`), {
        title: decodeEntities(course.title?.rendered || course.slug),
        slug: course.slug,
        price: course.slug.includes("mentally") ? "$199" : undefined,
        status: "Available now",
        partner: course.slug.includes("mentally") ? "Commune" : undefined,
        excerpt: stripTags(course.excerpt?.rendered || course.content?.rendered || "").slice(0, 240),
        contentHtml: cleanHtml(course.content?.rendered || ""),
        sourceUrl: course.link,
        image: featuredImage(course),
      });
    }
    return courses;
  }

  await writeJson(join(collections.courses, "mentally-well.json"), {
    title: "Mentally Well with Dr. Robin Berzin",
    slug: "mentally-well",
    price: "$199",
    status: "Available now",
    partner: "Commune",
    excerpt: "Mentally Well with Dr. Robin Berzin teaches you how to feel consistently happier and more energized by addressing common imbalances in your body.",
    contentHtml: "<p>Mentally Well with Dr. Robin Berzin teaches you how to feel consistently happier and more energized by addressing common imbalances in your body. Over the course of ten days, you will learn how to befriend your biochemistry to reset your mental patterns from the inside out.</p>",
    sourceUrl: "https://robinberzinmd.com/course/mentally-well/",
    image: {
      src: "https://robinberzinmd.com/wp-content/uploads/2024/09/Robin-Berzin-Mentally-Well-53918230252_00653d5e38_o-scaled.jpg",
      alt: "Mentally Well with Dr. Robin Berzin"
    }
  });
  await writeJson(join(collections.courses, "healing-your-gut-through-mind-body.json"), {
    title: "Healing Your Gut Through Mind & Body",
    slug: "healing-your-gut-through-mind-body",
    status: "Available now",
    excerpt: "A course on gut health through mind-body practices.",
    contentHtml: "<p>A course on gut health through mind-body practices.</p>",
    sourceUrl: "https://robinberzinmd.com/course/healing-your-gut-through-mind-body/",
    image: {
      src: "https://robinberzinmd.com/wp-content/uploads/2024/09/Healing-Your-Guy.webp",
      alt: "Healing Your Gut Through Mind & Body"
    }
  });
  return [];
}

async function writeRedirects() {
  await resetGeneratedDir(collections.redirects);
  const redirects = [
    // NOTE: /newsletter is a real page on the new site — do not redirect it.
    { source: "/p/every-woman-should-start-vaginal-estrogen-by-50-here-s-the-case", destination: "/vaginal-estrogen-prevention-longevity/", permanent: true },
    { source: "/p/your-labs-came-back-normal-so-why-are-you-exhausted", destination: "/normal-labs-fatigue-root-causes/", permanent: true },
    { source: "/p/not-all-protein-powders-are-created-equal-here-s-how-to-choose", destination: "/protein-powder-guide-complete-protein/", permanent: true },
    { source: "/p/fertility-after-35-8-levers-that-actually-work", destination: "/fertility-over-35-protocol/", permanent: true }
  ];
  for (const [index, redirect] of redirects.entries()) {
    await writeJson(join(collections.redirects, `${String(index + 1).padStart(2, "0")}.json`), redirect);
  }
}

async function main() {
  const [categories, tags] = await Promise.all([
    fetchAll("categories"),
    fetchAll("tags"),
  ]);
  await Promise.all([
    writeTaxonomies("categories", categories),
    writeTaxonomies("tags", tags),
  ]);
  const [posts, pages, courses] = await Promise.all([
    writeArticles(categories, tags),
    writePages(),
    writeCourses(),
    writeRedirects(),
  ]);
  await writeJson(join(ROOT, "src/data/current-site-inventory.json"), {
    generatedAt: new Date().toISOString(),
    source: "https://robinberzinmd.com",
    counts: {
      posts: posts.length,
      pages: pages.length,
      categories: categories.length,
      tags: tags.length,
      courses: courses.length,
    },
  });
  console.log(`Migrated ${posts.length} posts, ${pages.length} pages, ${categories.length} categories, ${tags.length} tags.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
