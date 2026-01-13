import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import VideoBackground from "@/components/layout/VideoBackground";
import AppLayout from "@/components/layout/AppLayout";
import AuthProvider from "@/components/providers/AuthProvider";
import { WeeklyReviewLockProvider } from "@/providers/WeeklyReviewLockProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elvison",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#139187",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${plusJakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <VideoBackground />
        <AuthProvider>
          <ThemeProvider>
            <WeeklyReviewLockProvider>
              <AppLayout>{children}</AppLayout>
            </WeeklyReviewLockProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
