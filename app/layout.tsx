import { Instrument_Sans, Geist_Mono, Geist } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'});

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

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
        instrumentSans.variable,
        geistHeading.variable,
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
