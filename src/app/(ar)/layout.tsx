import type { Metadata } from "next";
import "../globals.css";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = { metadataBase: new URL(siteOrigin), applicationName: "IBDAA Dental Lab" };

export default function ArabicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
