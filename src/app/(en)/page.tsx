import { HomePage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("en", "home");
export default function Page() { return <SiteShell locale="en" page="home"><HomePage locale="en" /><JsonLd data={structuredData("en", "home")} /></SiteShell>; }
