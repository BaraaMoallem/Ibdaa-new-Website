import Link from "next/link";
import { content, routes, whatsappUrl, type Locale } from "@/lib/site";

export function SectionHeading({ eyebrow, title, intro, align = "left" }: { eyebrow: string; title: string; intro?: string; align?: "left" | "center" }) {
  return <div className={`section-heading ${align === "center" ? "section-heading-center" : ""}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{intro && <p className="section-intro">{intro}</p>}</div>;
}

export function PageHero({ eyebrow, title, lead, section }: { eyebrow: string; title: string; lead: string; section: string }) {
  return <section className="page-hero"><div className="container page-hero-inner"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{lead}</p></div><div className="page-hero-index" aria-hidden="true"><span>{section}</span><i /></div></div></section>;
}

export function PhotoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return <div className={`photo-placeholder ${className}`} role="img" aria-label={label}>
    <div className="placeholder-orbit" aria-hidden="true"><span/><span/><span/></div>
    <p>{label}</p>
  </div>;
}

export function FinalCta({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <section className="final-cta"><div className="container final-cta-inner"><div><p className="eyebrow">{copy.ui.contact}</p><h2>{copy.home.finalTitle}</h2><p>{copy.home.finalBody}</p></div><div className="final-cta-actions"><a className="button button-accent" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{copy.ui.sendCase}<span aria-hidden="true">↗</span></a><Link className="text-link light-link" href={routes[locale].contact}>{copy.ui.contact}<span aria-hidden="true">↗</span></Link></div></div></section>;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
