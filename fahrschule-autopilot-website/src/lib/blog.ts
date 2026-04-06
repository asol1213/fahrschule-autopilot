/**
 * Blog-System mit JSON-Datei-Persistenz
 *
 * Artikel werden in src/data/blog-posts.json gespeichert.
 * Neue Artikel über die API werden zur Laufzeit im Memory gehalten
 * und bei nächstem Deploy in die JSON-Datei übernommen.
 */

// Re-export types from blog-types (client-safe)
export { BLOG_CATEGORIES } from "./blog-types";
export type { BlogPost, BlogCategory } from "./blog-types";

import type { BlogPost, BlogCategory } from "./blog-types";
import fs from "fs";
import path from "path";

// ============================================================
// JSON-Datei Persistenz (Node.js only — Edge/Client fallback to in-memory)
// ============================================================

const blogStore = new Map<string, BlogPost>();
let initialized = false;

/** Returns fs module if running in Node.js, null otherwise */
function getFs(): typeof fs | null {
  try {
    // Verify fs is actually available (not a shim)
    if (typeof fs.existsSync === "function") return fs;
  } catch {
    // Edge/Client runtime — fs not available
  }
  return null;
}

function getDataFile(): string {
  try {
    return path.join(process.cwd(), "src/data/blog-posts.json");
  } catch {
    return "";
  }
}

function loadFromFile(): void {
  if (initialized) return;
  const fs = getFs();
  const dataFile = getDataFile();
  if (fs && dataFile) {
    try {
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, "utf-8");
        const posts: BlogPost[] = JSON.parse(raw);
        posts.forEach((p) => blogStore.set(p.slug, p));
      }
    } catch (e) {
      console.error("Blog: Fehler beim Laden der JSON-Datei:", e);
    }
  }
  initialized = true;
}

function saveToFile(): void {
  const fs = getFs();
  const dataFile = getDataFile();
  if (!fs || !dataFile) return;
  try {
    const posts = Array.from(blogStore.values());
    fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), "utf-8");
  } catch {
    // Vercel: Filesystem ist read-only in production, das ist OK
  }
}

// ============================================================
// Blog API
// ============================================================

export function getAllPosts(): BlogPost[] {
  loadFromFile();
  return Array.from(blogStore.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  loadFromFile();
  return blogStore.get(slug) || null;
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function addPost(post: BlogPost): void {
  loadFromFile();
  blogStore.set(post.slug, post);
  saveToFile();
}

export function getAllSlugs(): string[] {
  loadFromFile();
  return Array.from(blogStore.keys());
}
