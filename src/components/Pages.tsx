import Link from "next/link";
import { content, restorationIds, routes, business, whatsappUrl, type Locale } from "@/lib/site";
import { FinalCta, PageHero, PhotoPlaceholder, SectionHeading } from "./Shared";

export function HomePage({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <>
    <section className="home-hero"><div className="container home-hero-grid">
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" />{copy.home.eyebrow}</p><h1><span className="hero-name">IBDAA Dental Lab</span>{copy.home.title}</h1><p className="hero-intro">{copy.home.intro}</p><div className="hero-actions"><a className="button button-accent" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{copy.ui.sendCase}<span aria-hidden="true">↗</span></a><Link className="button button-outline" href={routes[locale].restorations}>{copy.ui.explore}<span aria-hidden="true">↗</span></Link></div><p className="hero-note"><span aria-hidden="true" />{copy.home.heroNote}</p></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-art-frame"><span className="art-corner art-corner-one"/><span className="art-corner art-corner-two"/><div className="art-orbit art-orbit-one"/><div className="art-orbit art-orbit-two"/><div className="art-core"><div className="art-core-inner"/></div><span className="art-label art-label-top">IBDAA / 2016</span><span className="art-label art-label-bottom">PRECISION • AESTHETICS • VALUE</span></div></div>
    </div></section>

    <section className="facts-section"><div className="container facts-grid"><div className="facts-heading"><p className="eyebrow">{locale === "ar" ? "لمحة عن إبداع" : "AT A GLANCE"}</p><h2>{copy.home.factsTitle}</h2></div>{copy.home.facts.map(f => <div className="fact" key={f.label}><strong dir="ltr">{f.value}</strong><span>{f.label}</span></div>)}</div></section>

    <section className="section restorations-preview"><div className="container"><div className="section-heading-row"><SectionHeading eyebrow={copy.home.restorationsEyebrow} title={copy.home.restorationsTitle} intro={copy.home.restorationsIntro} /><Link className="text-link desktop-only" href={routes[locale].restorations}>{copy.ui.viewAll}<span aria-hidden="true">↗</span></Link></div><div className="restoration-grid">{restorationIds.map((id, index) => <Link className="restoration-card" key={id} href={`${routes[locale].restorations}#${id}`}><span className="card-index">0{index + 1}</span><span className="card-motif" aria-hidden="true"><i/><i/><i/></span><span className="card-bottom"><strong>{copy.restorations.items[id].name}</strong><span aria-hidden="true">↗</span></span></Link>)}</div><Link className="text-link mobile-only" href={routes[locale].restorations}>{copy.ui.viewAll}<span aria-hidden="true">↗</span></Link></div></section>

    <section className="section why-section"><div className="container why-grid"><div className="why-lead"><SectionHeading eyebrow={copy.home.whyEyebrow} title={copy.home.whyTitle} intro={copy.home.whyIntro} /><div className="precision-rule" aria-hidden="true"><span/><span/><span/></div></div><div className="why-list">{copy.home.why.map((item, i) => <div className="why-item" key={item.title}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></div>)}</div></div></section>

    <section className="section founder-section"><div className="container founder-grid"><PhotoPlaceholder label={copy.ui.photography} className="founder-photo" /><div className="founder-content"><SectionHeading eyebrow={copy.home.founderEyebrow} title={copy.home.founderTitle} /><p>{copy.home.founderBody}</p><Link className="text-link" href={routes[locale].about}>{copy.ui.learnMore}<span aria-hidden="true">↗</span></Link></div></div></section>

    <section className="section areas-section"><div className="container"><SectionHeading eyebrow={copy.home.areasEyebrow} title={copy.home.areasTitle} /><div className="areas-grid">{copy.home.areas.map((area, i) => <div className="area-card" key={area.title}><span>0{i + 1}</span><h3>{area.title}</h3><p>{area.body}</p></div>)}</div></div></section>
    <FinalCta locale={locale} />
  </>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <><PageHero section="01 / 03" eyebrow={copy.about.eyebrow} title={copy.about.title} lead={copy.about.lead} />
    <section className="section"><div className="container story-grid"><div className="story-side"><span className="section-number">01</span><p className="eyebrow">{locale === "ar" ? "نهجنا" : "OUR APPROACH"}</p></div><div className="story-main"><h2>{copy.about.storyTitle}</h2><p>{copy.about.story}</p><div className="story-tags"><span>{locale === "ar" ? "الدقة" : "Precision"}</span><span>{locale === "ar" ? "الجماليات" : "Aesthetics"}</span><span>{locale === "ar" ? "القيمة" : "Value"}</span></div></div></div></section>
    <section className="section founder-detail-section"><div className="container founder-grid"><PhotoPlaceholder label={copy.ui.photography} className="founder-photo" /><div className="founder-content"><p className="eyebrow">{locale === "ar" ? "المؤسس" : "FOUNDER"}</p><h2>{copy.about.founderTitle}</h2><p>{copy.about.founderBody}</p><div className="founder-notes"><span>{locale === "ar" ? "خريج جامعة دمشق" : "Damascus University graduate"}</span><span>{locale === "ar" ? "خبرة تزيد على 30 عاماً" : "More than 30 years of experience"}</span></div></div></div></section>
    <section className="section service-band"><div className="container service-band-inner"><div><p className="eyebrow">{locale === "ar" ? "نطاق العمل" : "SERVICE AREA"}</p><h2>{copy.about.serviceTitle}</h2><p>{copy.about.serviceBody}</p></div><Link className="text-link" href={routes[locale].contact}>{copy.ui.contact}<span aria-hidden="true">↗</span></Link></div></section>
    <FinalCta locale={locale} />
  </>;
}

export function RestorationsPage({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <><PageHero section="02 / 03" eyebrow={copy.restorations.eyebrow} title={copy.restorations.title} lead={copy.restorations.lead} />
    <section className="section"><div className="container"><div className="restorations-intro"><p>{copy.restorations.note}</p><span>{locale === "ar" ? "01 — 05 / التركيبات" : "01 — 05 / RESTORATIONS"}</span></div><div className="restoration-list">{restorationIds.map((id, index) => <article className="restoration-row" id={id} key={id}><div className="row-number">0{index + 1}</div><div className="row-visual" aria-hidden="true"><span className={`material-motif material-${id}`}/></div><div className="row-copy"><h2>{copy.restorations.items[id].name}</h2><p>{copy.restorations.items[id].description}</p><Link className="text-link" href={routes[locale].contact}>{copy.ui.contact}<span aria-hidden="true">↗</span></Link></div></article>)}</div></div></section>
    <section className="section digital-section"><div className="container digital-grid"><div className="digital-art" aria-hidden="true"><span className="digital-line one"/><span className="digital-line two"/><span className="digital-line three"/><div>CAD<br/><small>CAM</small></div></div><div><p className="eyebrow">{copy.restorations.digitalEyebrow}</p><h2>{copy.restorations.digitalTitle}</h2><p>{copy.restorations.digitalBody}</p></div></div></section>
    <FinalCta locale={locale} />
  </>;
}

export function ContactPage({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return <><PageHero section="03 / 03" eyebrow={copy.contact.eyebrow} title={copy.contact.title} lead={copy.contact.lead} />
    <section className="section contact-section"><div className="container contact-grid"><div className="contact-primary"><p className="eyebrow">{locale === "ar" ? "ابدأ هنا" : "START HERE"}</p><h2>{copy.contact.caseTitle}</h2><p>{copy.contact.caseBody}</p><a className="button button-accent" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{copy.ui.sendCase} {locale === "ar" ? "عبر واتساب" : "on WhatsApp"}<span aria-hidden="true">↗</span></a></div><div className="contact-details"><h2>{copy.contact.directTitle}</h2><div className="contact-detail"><span>{copy.ui.call}</span>{business.phone.map(phone => <a href={phone.href} dir="ltr" key={phone.href}>{phone.display}</a>)}</div><div className="contact-detail"><span>{copy.ui.email}</span><a href={`mailto:${business.email}`}>{business.email}</a></div><div className="contact-detail"><span>{copy.ui.facebook}</span><a href={business.facebook} target="_blank" rel="noopener noreferrer">{copy.ui.facebook} ↗</a></div></div></div></section>
    <section className="section location-section"><div className="container location-grid"><div><p className="eyebrow">{locale === "ar" ? "موقعنا" : "LOCATION"}</p><h2>{copy.contact.visitTitle}</h2><p>{copy.contact.visitBody}</p><a className="text-link" href={business.maps} target="_blank" rel="noopener noreferrer">{copy.ui.map}<span aria-hidden="true">↗</span></a></div><div className="location-panel"><span className="location-cross" aria-hidden="true">+</span><strong>{copy.ui.location}</strong><span>{copy.contact.areaTitle}</span><p>{copy.contact.areaBody}</p></div></div></section>
    <FinalCta locale={locale} />
  </>;
}
