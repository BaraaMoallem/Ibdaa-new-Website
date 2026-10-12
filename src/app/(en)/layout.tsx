import type { Metadata } from "next";
import "../globals.css";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = { metadataBase: new URL(siteOrigin), applicationName: "IBDAA Dental Lab" };

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions can add attributes to <html> before React hydrates it.
  return <html lang="en" dir="ltr" suppressHydrationWarning><body>{children}</body></html>;
}
