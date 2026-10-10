import { AboutPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("en", "about");
export default function Page() { return <SiteShell locale="en" page="about"><AboutPage locale="en" /><JsonLd data={structuredData("en", "about")} /></SiteShell>; }
