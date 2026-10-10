import Image from "next/image";
import Link from "next/link";
import { routes, type Locale } from "@/lib/site";

export function Brand({ locale, inverse = false }: { locale: Locale; inverse?: boolean }) {
  return (
    <Link href={routes[locale].home} className={`brand ${inverse ? "brand-inverse" : ""}`} aria-label={locale === "ar" ? "مختبر إبداع للأسنان - الرئيسية" : "IBDAA Dental Lab - Home"}>
      <Image src="/logo-ball.png" alt="" width={48} height={48} priority className="brand-mark" />
      <span className="brand-wordmark"><strong>IBDAA</strong><small>Dental Lab</small></span>
    </Link>
  );
}
