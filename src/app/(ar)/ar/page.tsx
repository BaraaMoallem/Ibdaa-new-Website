import { HomePage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("ar", "home");
export default function Page() { return <SiteShell locale="ar" page="home"><HomePage locale="ar" /><JsonLd data={structuredData("ar", "home")} /></SiteShell>; }
