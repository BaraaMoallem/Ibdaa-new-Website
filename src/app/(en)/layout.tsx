import type { Metadata } from "next";
import "../globals.css";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = { metadataBase: new URL(siteOrigin), applicationName: "IBDAA Dental Lab" };

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body>{children}</body></html>;
}
