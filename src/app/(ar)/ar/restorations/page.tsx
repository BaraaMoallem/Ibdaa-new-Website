import { RestorationsPage } from "@/components/Pages";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("ar", "restorations");
export default function Page() { return <SiteShell locale="ar" page="restorations"><RestorationsPage locale="ar" /><JsonLd data={structuredData("ar", "restorations")} /></SiteShell>; }
