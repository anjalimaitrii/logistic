import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans, Geist } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FleetTrack - Premium Logistics & Fleet Management",
  description: "Modern logistics and fleet management platform for global businesses.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FleetTrack",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", sora.variable, dmSans.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col relative">
        <div className="africa-pattern" />
        <main className="relative z-10 flex-1 flex flex-col">
          {children}
        </main>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
