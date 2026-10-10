import type { Metadata } from "next";
import { absoluteUrl, business, routes, siteOrigin, type Locale, type PageKey } from "./site";

const pageMeta: Record<Locale, Record<PageKey, { title: string; description: string }>> = {
  en: {
    home: { title: "IBDAA Dental Lab | CAD/CAM Dental Lab in Nasr City, Cairo", description: "IBDAA Dental Lab serves dentists in Cairo and Assiut with quality-focused Zirconia, Zircomax, E.max, Veneers and PFM restorations. CAD/CAM workflow in Nasr City." },
    about: { title: "About IBDAA Dental Lab | Founded by DT Yasser Zaineh", description: "Meet IBDAA Dental Lab, founded in 2016 by Damascus University graduate DT Yasser Zaineh. Serving dentists from Nasr City, Cairo with over 30 years of founder experience." },
    restorations: { title: "Dental Restorations in Cairo | IBDAA Dental Lab", description: "Explore Zirconia, Zircomax, E.max, Veneers and PFM restorations from IBDAA Dental Lab. CAD/CAM capability for dentists in Cairo and Assiut." },
    contact: { title: "Contact & Send a Case | IBDAA Dental Lab Cairo", description: "Send a dental case or contact IBDAA Dental Lab in Nasr City, Cairo by WhatsApp, phone or email. Serving dentists in Cairo and Assiut, with shipping to Port Said." },
  },
  ar: {
    home: { title: "مختبر إبداع للأسنان | تركيبات سنية و CAD/CAM في مدينة نصر", description: "مختبر إبداع للأسنان في مدينة نصر بالقاهرة يخدم أطباء الأسنان بتركيبات الزيركونيا وزيركوماكس وإي ماكس والقشور وPFM، مع تقنيات CAD/CAM." },
    about: { title: "عن مختبر إبداع للأسنان | خبرة DT Yasser Zaineh", description: "تعرّف على مختبر إبداع للأسنان الذي تأسس عام 2016 على يد فني الأسنان DT Yasser Zaineh، خريج جامعة دمشق وصاحب خبرة تزيد على 30 عاماً." },
    restorations: { title: "التركيبات السنية في القاهرة | مختبر إبداع للأسنان", description: "خيارات تركيبات الزيركونيا وزيركوماكس وإي ماكس والقشور التجميلية وPFM لأطباء الأسنان، مع استخدام CAD/CAM في مختبر إبداع بالقاهرة." },
    contact: { title: "تواصل وأرسل حالة | مختبر إبداع للأسنان", description: "تواصل مع مختبر إبداع للأسنان في مدينة نصر بالقاهرة عبر واتساب أو الهاتف أو البريد الإلكتروني. نخدم أطباء الأسنان في القاهرة وأسيوط مع الشحن إلى بورسعيد." },
  },
};

export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const meta = pageMeta[locale][page];
  const path = routes[locale][page];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      languages: { en: routes.en[page], ar: routes.ar[page], "x-default": routes.en[page] },
    },
    openGraph: {
      type: "website", locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      url: absoluteUrl(path), siteName: business.name, title: meta.title, description: meta.description,
      images: [{ url: absoluteUrl("/og-card.png"), width: 1200, height: 630, alt: "IBDAA Dental Lab brand mark and name" }],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [absoluteUrl("/og-card.png")] },
  };
}

export function structuredData(locale: Locale, page: PageKey) {
  const path = routes[locale][page];
  const url = absoluteUrl(path);
  const description = pageMeta[locale][page].description;
  const organizationId = `${siteOrigin}/#organization`;
  const websiteId = `${siteOrigin}/#website`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization", "@id": organizationId, name: business.name,
      alternateName: "مختبر إبداع للأسنان", url: siteOrigin,
      logo: absoluteUrl("/logo-ball.png"), image: absoluteUrl("/logo-ball.png"),
      description: "Dental laboratory serving dentists in Cairo and Assiut, with shipping to Port Said.",
      foundingDate: "2016", founder: { "@id": `${siteOrigin}/#founder` },
      areaServed: [{ "@type": "Place", name: "Cairo" }, { "@type": "Place", name: "Assiut" }],
      location: { "@type": "Place", name: "Nasr City, Cairo" },
      telephone: business.phone.map((phone) => phone.display), email: business.email,
      sameAs: [business.facebook],
      contactPoint: business.phone.map((phone) => ({ "@type": "ContactPoint", telephone: phone.display, contactType: "customer service" })),
    },
    {
      "@type": "Person", "@id": `${siteOrigin}/#founder`, name: business.founder,
      alumniOf: { "@type": "CollegeOrUniversity", name: "Damascus University" },
      description: "Founder of IBDAA Dental Lab with more than 30 years of experience.",
    },
    {
      "@type": "WebSite", "@id": websiteId, url: siteOrigin,
      name: business.name, inLanguage: ["en", "ar"], publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage", "@id": `${url}#webpage`, url, name: pageMeta[locale][page].title,
      description, inLanguage: locale, isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
    },
  ];
  if (page !== "home") {
    graph.push({
      "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "ar" ? "الرئيسية" : "Home", item: absoluteUrl(routes[locale].home) },
        { "@type": "ListItem", position: 2, name: page === "about" ? (locale === "ar" ? "من نحن" : "About") : page === "restorations" ? (locale === "ar" ? "التركيبات السنية" : "Dental Restorations") : (locale === "ar" ? "تواصل معنا" : "Contact"), item: url },
      ],
    });
  }
  if (page === "restorations") {
    for (const item of ["Zirconia", "Zircomax", "E.max", "Veneers", "PFM", "CAD/CAM"]) {
      graph.push({ "@type": "Service", name: item === "CAD/CAM" ? "CAD/CAM dental laboratory workflow" : `${item} dental restorations`, provider: { "@id": organizationId }, areaServed: [{ "@type": "Place", name: "Cairo" }, { "@type": "Place", name: "Assiut" }] });
    }
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
