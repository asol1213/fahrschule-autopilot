import { notFound, redirect } from "next/navigation";
import { getPostBySlug, getAllSlugs, getAllPosts, BLOG_CATEGORIES } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Params = Promise<{ slug: string }>;

/** Redirect map for old/renamed blog slugs */
const SLUG_REDIRECTS: Record<string, string> = {
  "fuehrerschein-kosten-2025": "fuehrerschein-kosten-2026-deutschland",
  "theorie-lernen-tipps": "theoretische-pruefung-bestehen-tipps",
  "erste-fahrstunde": "erste-fahrstunde-was-erwartet-mich",
  "automatik-vs-schaltung": "/blog",
  "pruefungsangst-ueberwinden": "/blog",
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (SLUG_REDIRECTS[slug]) return {};
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seo.title,
    description: post.seo.description,
    keywords: post.seo.keywords,
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.image ? [{ url: post.image }] : [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;

  // Handle old slug redirects
  const redirectTarget = SLUG_REDIRECTS[slug];
  if (redirectTarget) {
    const target = redirectTarget.startsWith("/") ? redirectTarget : `/blog/${redirectTarget}`;
    redirect(target);
  }

  const post = getPostBySlug(slug);
  if (!post) notFound();

  const cat = BLOG_CATEGORIES[post.category];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <article className="mx-auto max-w-3xl px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground">{post.title.slice(0, 40)}...</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-${cat.color}-500/10 text-${cat.color}-400`}>
                {cat.label}
              </span>
              <span className="text-xs text-muted">{post.readingTime} Min Lesezeit</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span>{post.author}</span>
              <span>{post.publishedAt}</span>
            </div>
          </div>

          {/* Cover Image */}
          {post.image && (
            <div className="mb-8 rounded-xl overflow-hidden border border-border">
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                width={800}
                height={400}
                className="w-full h-48 md:h-64 object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert max-w-none
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-foreground
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-foreground
              [&_p]:text-muted [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:space-y-2 [&_ul]:mb-4 [&_li]:text-muted
              [&_strong]:text-foreground
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
              [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-border [&_th]:text-sm [&_th]:font-medium
              [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-border/50 [&_td]:text-sm [&_td]:text-muted"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted bg-surface-lighter px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Social Sharing */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted mb-3">Artikel teilen:</p>
            <div className="flex gap-3">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://fahrschulautopilot.de/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=https://fahrschulautopilot.de/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(post.title + " — https://fahrschulautopilot.de/blog/" + post.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-8 p-6 rounded-xl border border-primary/20 bg-primary/5">
            <h3 className="text-lg font-semibold mb-2">Neue Artikel direkt ins Postfach</h3>
            <p className="text-sm text-muted mb-4">Prüfungstipps, Verkehrsregeln und Fahrschul-News — 1x pro Woche, kein Spam.</p>
            <form className="flex gap-2" action="/api/newsletter" method="POST">
              <input
                type="email"
                name="email"
                placeholder="Deine E-Mail-Adresse"
                required
                className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
              />
              <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
                Abonnieren
              </button>
            </form>
            <p className="text-[11px] text-muted mt-2">Jederzeit abbestellbar. Wir respektieren deine Privatsphäre.</p>
          </div>

          {/* Related Articles */}
          {(() => {
            const related = getAllPosts()
              .filter((p) => p.slug !== post.slug)
              .filter((p) => p.category === post.category || p.tags.some((t) => post.tags.includes(t)))
              .slice(0, 3);
            if (related.length === 0) return null;
            return (
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Weitere Artikel</h3>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      className="block p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-muted">{BLOG_CATEGORIES[r.category].label}</span>
                        <span className="text-[11px] text-muted">{r.readingTime} Min</span>
                      </div>
                      <p className="text-sm font-medium">{r.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Back to Blog */}
          <div className="mt-8">
            <Link
              href="/blog"
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              ← Alle Artikel
            </Link>
          </div>
        </article>

        {/* BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://fahrschulautopilot.de" },
                { "@type": "ListItem", position: 2, name: "Blog", item: "https://fahrschulautopilot.de/blog" },
                { "@type": "ListItem", position: 3, name: post.title },
              ],
            }),
          }}
        />

        {/* Article Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.seo.description,
              datePublished: post.publishedAt,
              author: { "@type": "Organization", name: post.author },
              publisher: { "@type": "Organization", name: "Fahrschule Autopilot" },
            }),
          }}
        />
      </main>
      <Footer />
    </>
  );
}

/**
 * Simple Markdown to HTML (basic subset — no external dependency needed)
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:text-primary-light underline underline-offset-2">$1</a>')
    .replace(/^\- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_match, header: string, body: string) => {
      const headers = header.split("|").filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join("");
      const rows = body.trim().split("\n").map((row: string) => {
        const cells = row.split("|").filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hultop])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}
