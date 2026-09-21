import { Plus_Jakarta_Sans, Geist_Mono, Geist } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

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
