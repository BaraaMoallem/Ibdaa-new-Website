import Link from "next/link";
import Image from "next/image";
import { content, routes, type Locale } from "@/lib/site";

export function SectionHeading({ eyebrow, title, intro, align = "left" }: { eyebrow: string; title: string; intro?: string; align?: "left" | "center" }) {
  return <div className={`section-heading ${align === "center" ? "section-heading-center" : ""}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{intro && <p className="section-intro">{intro}</p>}</div>;
}

export function PageHero({ eyebrow, title, lead, section }: { eyebrow: string; title: string; lead: string; section: string }) {
  return <section className="page-hero"><div className="container page-hero-inner"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{lead}</p></div><div className="page-hero-index" aria-hidden="true"><span>{section}</span><i /></div></div></section>;
}

export function ImageArea({ src, alt, className = "", sizes, priority = false }: { src: string; alt: string; className?: string; sizes: string; priority?: boolean }) {
  return <div className={`image-area ${className}`}>
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="image-area-img" />
  </div>;
}

export function FinalCta({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <section className="final-cta"><div className="container final-cta-inner"><div><p className="eyebrow">{copy.ui.contact}</p><h2>{copy.home.finalTitle}</h2><p>{copy.home.finalBody}</p></div><div className="final-cta-actions"><Link className="button button-accent" href={routes[locale].sendCase}>{copy.ui.sendCase}<span aria-hidden="true">↗</span></Link><Link className="text-link light-link" href={routes[locale].contact}>{copy.ui.contact}<span aria-hidden="true">↗</span></Link></div></div></section>;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
