import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import K from "@/components/icons/k";
import { InteractiveText } from "@/components/landingpage/interactive-text";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <header className="w-full border-b border-border/5">
        <div className="w-full flex h-20 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-2 group cursor-default">
            <K className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">Komunikasi</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center justify-center border border-border/60 text-foreground hover:bg-foreground/5 hover:border-foreground/20 text-sm font-medium rounded-full px-6 h-9 transition-all duration-200"
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimateInView direction="up" delay={0.2}>
          <InteractiveText text="komunikasi" />
        </AnimateInView>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-border/10">
        <div className="w-full px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] font-[family-name:var(--font-doto)]">
            © 2003 Komunikasi
          </p>
          <div className="flex gap-6">
            <Link
              href="https://github.com/thirapi"
              target="_blank"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest font-[family-name:var(--font-doto)]"
            >
              GITHUB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
