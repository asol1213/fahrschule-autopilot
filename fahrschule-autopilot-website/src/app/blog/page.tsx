import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: "Blog — Fahrschule Autopilot | Tipps für Fahrschüler",
  description: "Prüfungstipps, Verkehrsregeln, Kosten und mehr — alles was Fahrschüler wissen müssen.",
  alternates: { canonical: "https://fahrschulautopilot.de/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Fahrschul-<span className="gradient-text">Blog</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Tipps für die Prüfung, Verkehrsregeln erklärt, Kosten im Überblick — alles was Fahrschüler wissen müssen.
            </p>
          </div>

          {/* Posts with interactive filter */}
          <BlogList posts={posts} />

          {posts.length === 0 && (
            <div className="text-center py-16 text-muted">
              Noch keine Artikel vorhanden.
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5">
            <h3 className="text-lg font-semibold mb-2">Neue Artikel direkt ins Postfach</h3>
            <p className="text-sm text-muted mb-4">
              Prüfungstipps, Verkehrsregeln und Fahrschul-News — 1x pro Woche, kein Spam.
            </p>
            <form className="flex flex-col sm:flex-row gap-2" action="/api/newsletter" method="POST">
              <input
                type="email"
                name="email"
                placeholder="Deine E-Mail-Adresse"
                required
                className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Abonnieren
              </button>
            </form>
            <p className="text-[11px] text-muted mt-2">Jederzeit abbestellbar. DSGVO-konform.</p>
          </div>
        </div>
      </main>
      <Footer />

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
            ],
          }),
        }}
      />
    </>
  );
}
