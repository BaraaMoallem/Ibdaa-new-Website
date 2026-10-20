import { caseCopy } from "@/lib/case-copy";
import type { Locale } from "@/lib/site";
import { CaseForm } from "./CaseForm";
import { PageHero } from "./Shared";

export function SendCasePage({ locale }: { locale: Locale }) {
  const copy = caseCopy[locale];
  return <><PageHero eyebrow={copy.eyebrow} title={copy.title} lead={copy.intro} section="IBDAA / RX" /><CaseForm locale={locale} /></>;
}
