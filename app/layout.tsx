import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Geist_Mono, Geist } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SerenaRaga - Pijat Panggilan Jogja & Home Massage Nyaman",
  description: "Layanan pijat panggilan Jogja & home massage profesional, bersertifikat, dan nyaman ke rumah, hotel, villa, serta kos di Yogyakarta.",
  keywords: [
    "pijat panggilan jogja",
    "massage panggilan jogja",
    "spa panggilan jogja",
    "home massage jogja",
    "pijat tradisional jogja",
    "serenaraga",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SerenaRaga - Pijat Panggilan Jogja & Home Massage Nyaman",
    description: "Layanan pijat panggilan Jogja & home massage profesional, bersertifikat, dan nyaman ke rumah, hotel, villa, serta kos di Yogyakarta.",
    type: "website",
    locale: "id_ID",
    url: "https://serenaraga.com",
    siteName: "SerenaRaga",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const gallient = localFont({
  src: "../public/font/Gallient Regular.ttf",
  variable: "--font-gallient",
  display: "swap",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        plusJakartaSans.variable,
        geistHeading.variable,
        gallient.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body className="font-sans">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
