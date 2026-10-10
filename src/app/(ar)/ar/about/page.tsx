import { AboutPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("ar", "about");
export default function Page() { return <SiteShell locale="ar" page="about"><AboutPage locale="ar" /><JsonLd data={structuredData("ar", "about")} /></SiteShell>; }
