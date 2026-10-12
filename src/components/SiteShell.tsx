import Link from "next/link";
import { Brand } from "./Brand";
import { business, content, nav, routes, whatsappUrl, type Locale, type PageKey } from "@/lib/site";

function LanguageSwitch({ locale, page }: { locale: Locale; page: PageKey }) {
  return <div className="language-switch" aria-label={content[locale].ui.switchLanguage}>
    <Link href={routes.en[page]} hrefLang="en" lang="en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
    <span aria-hidden="true" />
    <Link href={routes.ar[page]} hrefLang="ar" lang="ar" dir="rtl" aria-current={locale === "ar" ? "page" : undefined}>عربي</Link>
  </div>;
}

export function SiteShell({ locale, page, children }: { locale: Locale; page: PageKey; children: React.ReactNode }) {
  const ui = content[locale].ui;
  return <>
    <a className="skip-link" href="#main">{ui.skip}</a>
    <header className="site-header">
      <div className="container header-inner">
        <Brand locale={locale} />
        <nav className="desktop-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav[locale].map(item => <Link key={item.key} href={routes[locale][item.key]} aria-current={page === item.key ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <LanguageSwitch locale={locale} page={page} />
          <a className="button button-small button-dark header-cta" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{ui.sendCase}<span aria-hidden="true">↗</span></a>
        </div>
        <details className="mobile-menu">
          <summary>{ui.menu}<span aria-hidden="true" className="menu-bars"><i/><i/></span></summary>
          <nav aria-label={locale === "ar" ? "قائمة الهاتف" : "Mobile navigation"}>
            {nav[locale].map(item => <Link key={item.key} href={routes[locale][item.key]} aria-current={page === item.key ? "page" : undefined}>{item.label}</Link>)}
            <LanguageSwitch locale={locale} page={page} />
            <a className="button button-dark" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{ui.sendCase}<span aria-hidden="true">↗</span></a>
          </nav>
        </details>
      </div>
    </header>
    <main id="main">{children}</main>
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-intro"><Brand locale={locale} inverse /><p>{ui.audience}<br />{ui.location}</p></div>
        <div className="footer-group"><h2>{locale === "ar" ? "تصفح" : "Explore"}</h2>{nav[locale].map(item => <Link key={item.key} href={routes[locale][item.key]}>{item.label}</Link>)}</div>
        <div className="footer-group"><h2>{ui.contact}</h2><a href={business.phone[0].href} dir="ltr">{business.phone[0].display}</a><a href={business.phone[1].href} dir="ltr">{business.phone[1].display}</a><a href={`mailto:${business.email}`}>{business.email}</a></div>
        <div className="footer-group"><h2>{locale === "ar" ? "تابعنا واعثر علينا" : "Find us"}</h2><a href={business.maps} target="_blank" rel="noopener noreferrer">{ui.map} ↗</a><a href={business.facebook} target="_blank" rel="noopener noreferrer">{ui.facebook} ↗</a><a href={business.instagram} target="_blank" rel="noopener noreferrer">{ui.instagram} ↗</a></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} IBDAA Dental Lab</span><span>{ui.location}</span></div>
    </footer>
  </>;
}
