import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Komunikasi - Obrolan Ringan & Cepat",
  description: "Website Komunikasi sederhana untuk obrolan ringan dan cepat.",
  keywords: ["komunikasi", "chat online", "obrolan cepat", "komunikasi ringan"],
  openGraph: {
    title: "Komunikasi - Obrolan Ringan & Cepat",
    description: "Website Komunikasi sederhana untuk obrolan ringan dan cepat.",
    url: "https://komunikasi.vercel.app/", 
    siteName: "Komunikasi",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Komunikasi - Obrolan Ringan",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Komunikasi - Obrolan Ringan & Cepat",
    description: "Website Komunikasi sederhana untuk obrolan ringan dan cepat.",
    images: ["/og-image.png"], 
  },
  metadataBase: new URL("https://komunikasi.vercel.app/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
