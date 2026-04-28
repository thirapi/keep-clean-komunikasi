import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import K from "@/components/icons/k";
import { InteractiveText } from "@/components/landingpage/interactive-text";

import { GravityBackground } from "@/components/landingpage/gravity-background";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent text-foreground selection:bg-primary/20 selection:text-primary overflow-hidden">
      <GravityBackground />
      {/* Navbar */}
      <header className="w-full fixed top-0 z-50 transition-all duration-300">
        <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 lg:px-12 backdrop-blur-[2px] bg-background/5">
          <div className="flex items-center gap-2 group cursor-default">
            <K className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">Komunikasi</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center justify-center border border-foreground/20 bg-background/40 backdrop-blur-md text-foreground hover:bg-foreground/10 hover:border-foreground/40 text-sm font-medium rounded-full px-6 h-9 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-full px-6 h-9 transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-20 gap-8">
        <AnimateInView direction="up" delay={0.2}>
          <InteractiveText text="komunikasi" />
        </AnimateInView>
        
        {/* Mobile-only CTA */}
        <AnimateInView direction="up" delay={0.4} className="flex sm:hidden items-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center border border-foreground/30 bg-background/40 backdrop-blur-md text-foreground text-sm font-medium rounded-full px-8 h-11 transition-all hover:bg-background/60"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium rounded-full px-8 h-11 transition-all"
          >
            Sign Up
          </Link>
        </AnimateInView>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-transparent text-foreground/50 text-xs tracking-tight">
        <div className="w-full px-6 lg:px-12 flex justify-end gap-4">
          <span>© {new Date().getFullYear()} Komunikasi</span>
        </div>
      </footer>
    </div>
  );
}
