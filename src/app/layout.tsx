import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Doto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegister } from "@/components/sw-register";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;
const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
});

export const metadata: Metadata = {
  title: "Komunikasi",
  description:
    "Komunikasi adalah aplikasi web chat untuk obrolan ringan, cepat, dan aman. Cocok untuk tim, komunitas, and keluarga.",
  keywords: [
    "komunikasi",
    "web chat app",
    "aplikasi komunikasi",
    "chat online",
    "komunikasi ringan",
    "grup chat Indonesia",
  ],
  openGraph: {
    title: "Komunikasi",
    description:
      "Komunikasi adalah aplikasi web chat untuk obrolan ringan, cepat, dan aman. Cocok untuk tim, komunitas, dan keluarga.",
    url: "https://komunikasi.qzz.io/",
    siteName: "Komunikasi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Komunikasi",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Komunikasi",
    description:
      "Komunikasi adalah aplikasi web chat untuk obrolan ringan, cepat, and aman.",
    images: ["/og-image.png"],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Komunikasi",
  },
  metadataBase: new URL("https://komunikasi.qzz.io/"),
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${doto.variable} antialiased h-full flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader 
            color="#A855F7" 
            showSpinner={false} 
            shadow={false}
            height={5}
            crawl={true}
            showAtBottom={false}
            zIndex={999999}
          />
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
