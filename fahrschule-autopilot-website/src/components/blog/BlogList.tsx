"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BLOG_CATEGORIES, type BlogPost, type BlogCategory } from "@/lib/blog-types";

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [filter, setFilter] = useState<BlogCategory | "all">("all");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);
  const categories = Object.entries(BLOG_CATEGORIES) as [BlogCategory, { label: string; color: string }][];

  return (
    <>
      {/* Interactive Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            filter === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted hover:text-foreground hover:border-primary/30"
          }`}
        >
          Alle ({posts.length})
        </button>
        {categories.map(([key, cat]) => {
          const count = posts.filter((p) => p.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filtered.map((post) => {
          const cat = BLOG_CATEGORIES[post.category];
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-border bg-surface overflow-hidden hover:border-primary/30 hover:bg-surface-light transition-all"
            >
              {post.image && (
                <Image
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  width={800}
                  height={400}
                  className="w-full h-40 object-cover"
                  unoptimized
                />
              )}
              <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-${cat.color}-500/10 text-${cat.color}-400`}>
                  {cat.label}
                </span>
                <span className="text-xs text-muted">{post.readingTime} Min Lesezeit</span>
                <span className="text-xs text-muted">{post.publishedAt}</span>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">{post.title}</h2>
              <p className="text-sm text-muted leading-relaxed">{post.excerpt}</p>
              <div className="flex gap-2 mt-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-muted bg-surface-lighter px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted">
          Keine Artikel in dieser Kategorie.
        </div>
      )}
    </>
  );
}
