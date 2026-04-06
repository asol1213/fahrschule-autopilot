import { ImageResponse } from "next/og";
import { BLOG_CATEGORIES } from "@/lib/blog-types";
import type { BlogPost } from "@/lib/blog-types";
import blogPostsData from "@/data/blog-posts.json";

export const runtime = "edge";
export const alt = "Fahrschule Autopilot Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = (blogPostsData as BlogPost[]).find((p) => p.slug === slug);

  const title = post?.title || "Fahrschul-Blog";
  const category = post ? BLOG_CATEGORIES[post.category].label : "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #3b82f6, #10b981)",
          }}
        />

        {/* Category badge */}
        {category && (
          <div
            style={{
              fontSize: 18,
              color: "#10b981",
              marginBottom: 24,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {category}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#f0f0f5",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 20, color: "#8888a0" }}>
            Fahrschule Autopilot
          </div>
          <div style={{ fontSize: 16, color: "#3b82f6" }}>
            fahrschulautopilot.de/blog
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
