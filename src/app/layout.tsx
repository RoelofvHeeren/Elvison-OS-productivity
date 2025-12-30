import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import VideoBackground from "@/components/layout/VideoBackground";
import Sidebar from "@/components/layout/Sidebar";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Elvison OS",
  description: "AI-Enhanced Personal Productivity Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <VideoBackground />
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
