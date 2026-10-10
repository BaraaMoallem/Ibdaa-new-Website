import { ContactPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("ar", "contact");
export default function Page() { return <SiteShell locale="ar" page="contact"><ContactPage locale="ar" /><JsonLd data={structuredData("ar", "contact")} /></SiteShell>; }
