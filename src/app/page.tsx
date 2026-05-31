import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import K from "@/components/icons/k";
import { GravityBackground } from "@/components/landingpage/gravity-background";
import { getUserSession } from "@/app/auth.action";
import { redirect } from "next/navigation";
import { InteractiveText } from "@/components/landingpage/interactive-text";
import { AuthContainer } from "@/components/landingpage/auth-container";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Komunikasi",
  description: "Komunikasi adalah platform pesan instan modern yang dirancang untuk kecepatan, keamanan, dan produktivitas. Hubungkan tim Anda dan berbagi ide dengan lancar.",
  keywords: ["chat", "real-time", "komunikasi", "pesan instan", "kolaborasi", "platform chat", "aman"],
  authors: [{ name: "Thirafi" }],
  openGraph: {
    title: "Komunikasi",
    description: "Hubungkan tim Anda dan berbagi ide dengan lancar di platform komunikasi masa depan.",
    url: "https://komunikasi.qzz.io",
    siteName: "Komunikasi",
    locale: "id_ID",
    type: "website",
  },
};

export default async function Home() {
  const session = await getUserSession();

  // If user is already logged in, redirect to the app immediately
  if (session) {
    redirect("/timeline");
  }

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row bg-background selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Komunikasi",
            url: "https://komunikasi.qzz.io",
            description: "Platform pesan instan modern untuk kolaborasi tim.",
            applicationCategory: "CommunicationApplication",
          }),
        }}
      />

      {/* Full-width Gravity Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <GravityBackground />
      </div>

      {/* Left Side: Visuals & Interactive Text */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center">
        <div className="w-full">
          <AnimateInView direction="up" delay={0.2}>
            <InteractiveText text="komunikasi" />
          </AnimateInView>
        </div>
      </div>

      {/* Right Side: Auth Container with Glassmorphism */}
      <div className="flex-1 flex flex-col relative z-10 min-h-screen lg:min-h-0 lg:bg-background/20 lg:backdrop-blur-md lg:border-l lg:border-border/10">
        <header className="h-20 flex items-center justify-between px-6 lg:px-12 z-20">
          <div className="flex lg:hidden items-center gap-2 group">
            <K className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">Komunikasi</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-20 pb-20 z-10">
          <AnimateInView direction="up" className="w-full max-w-md space-y-8">            
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>}>
              <div className="glass-morphism rounded-2xl overflow-hidden shadow-2xl">
                <AuthContainer />
              </div>
            </Suspense>
          </AnimateInView>
        </main>

        {/* Footer - Simple as original */}
        <footer className="w-full py-6 bg-transparent text-foreground/50 text-xs tracking-tight z-10">
          <div className="w-full px-6 lg:px-12 flex justify-end gap-4">
            <span>© {new Date().getFullYear()} Komunikasi</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
