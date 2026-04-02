import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

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
  title: "FleetLink - Premium Logistics & Fleet Management",
  description: "Modern fleet management and logistics platform for African businesses.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FleetLink",
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
      className={`${sora.variable} ${dmSans.variable} h-full antialiased`}
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
