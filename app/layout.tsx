import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "TripMate AI: plan a group trip everyone agrees on",
    template: "%s · TripMate AI",
  },
  description:
    "Collect everyone's budget, dates and preferences in one place, then get balanced trip options your group can actually agree on.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ConfigBanner />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
