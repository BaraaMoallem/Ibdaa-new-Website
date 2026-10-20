import { SendCasePage } from "@/components/SendCasePage";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/Shared";
import { pageMetadata, structuredData } from "@/lib/seo";

export const metadata = pageMetadata("en", "sendCase");
export default function Page() {
  return <SiteShell locale="en" page="sendCase"><SendCasePage locale="en" /><JsonLd data={structuredData("en", "sendCase")} /></SiteShell>;
}
