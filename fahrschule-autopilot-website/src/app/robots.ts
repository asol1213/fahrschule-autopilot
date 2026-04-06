import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/login/", "/auth/"],
      },
    ],
    sitemap: "https://fahrschulautopilot.de/sitemap.xml",
  };
}
