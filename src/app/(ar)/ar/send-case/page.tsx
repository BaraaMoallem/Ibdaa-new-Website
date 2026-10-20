import { SendCasePage } from "@/components/SendCasePage";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("ar", "sendCase");
export default function Page() {
  return <SiteShell locale="ar" page="sendCase"><SendCasePage locale="ar" /><JsonLd data={structuredData("ar", "sendCase")} /></SiteShell>;
}
