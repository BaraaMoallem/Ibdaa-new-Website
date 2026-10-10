import { ContactPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("en", "contact");
export default function Page() { return <SiteShell locale="en" page="contact"><ContactPage locale="en" /><JsonLd data={structuredData("en", "contact")} /></SiteShell>; }
