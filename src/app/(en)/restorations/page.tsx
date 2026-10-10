import { RestorationsPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("en", "restorations");
export default function Page() { return <SiteShell locale="en" page="restorations"><RestorationsPage locale="en" /><JsonLd data={structuredData("en", "restorations")} /></SiteShell>; }
