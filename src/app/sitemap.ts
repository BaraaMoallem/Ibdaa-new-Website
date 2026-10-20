import type { MetadataRoute } from "next";
import { absoluteUrl, routes, type PageKey } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return (["home", "about", "restorations", "contact", "sendCase"] as PageKey[]).flatMap(page => ["en", "ar"].map(locale => ({
    url: absoluteUrl(routes[locale as "en" | "ar"][page]),
    changeFrequency: "monthly" as const,
    priority: page === "home" ? 1 : 0.7,
    alternates: { languages: { en: absoluteUrl(routes.en[page]), ar: absoluteUrl(routes.ar[page]), "x-default": absoluteUrl(routes.en[page]) } },
  })));
}
