/**
 * Blog Types — Shared between server and client components
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  image?: string;
  imageAlt?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export type BlogCategory =
  | "pruefungstipps"
  | "verkehrsregeln"
  | "kosten"
  | "erste-fahrstunde"
  | "saisonales"
  | "technik"
  | "sicherheit"
  | "marketing";

export const BLOG_CATEGORIES: Record<BlogCategory, { label: string; color: string }> = {
  pruefungstipps: { label: "Prüfungstipps", color: "blue" },
  verkehrsregeln: { label: "Verkehrsregeln", color: "green" },
  kosten: { label: "Kosten & Finanzen", color: "orange" },
  "erste-fahrstunde": { label: "Erste Fahrstunde", color: "purple" },
  saisonales: { label: "Saisonales", color: "cyan" },
  technik: { label: "Technik", color: "red" },
  sicherheit: { label: "Sicherheit", color: "yellow" },
  marketing: { label: "Marketing", color: "pink" },
};
