import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ 
  subsets: ["latin"], 
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif" 
});

const sans = DM_Sans({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

const mono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600"],
  variable: "--font-mono" 
});

import { Providers } from "./providers";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "RiskMatrix — Multi-Asset Portfolio Risk Dashboard",
  description: "Institutional-grade multi-asset risk analytics platform",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} font-sans min-h-screen bg-background text-foreground antialiased overflow-x-hidden selection:bg-accent selection:text-white`}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}

