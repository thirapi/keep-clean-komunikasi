import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import K from "@/components/icons/k";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <header className="w-full">
        <div className="w-full max-w-screen-xl mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-2 group cursor-default">
            <K className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">Komunikasi</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="hidden sm:flex items-center gap-3">
              <Button variant="ghost" className="text-sm font-medium" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button className="rounded-full px-6" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-10">
          <AnimateInView direction="up" delay={0.1}>
            <div className="flex justify-center">
              <K className="w-20 h-20 sm:w-24 sm:h-24 text-primary stroke-[1.2]" />
            </div>
          </AnimateInView>

          <div className="space-y-4">
            <AnimateInView direction="up" delay={0.2}>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter">
                Komunikasi
              </h1>
            </AnimateInView>
            <AnimateInView direction="up" delay={0.3}>
              <p className="text-base sm:text-lg text-muted-foreground/80 font-medium lowercase tracking-widest">
                Real-time Web Chat
              </p>
            </AnimateInView>
          </div>

          <AnimateInView direction="up" delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[140px] rounded-full font-bold"
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto min-w-[140px] rounded-full font-bold"
                asChild
              >
                <Link href="/signin">Sign In</Link>
              </Button>
            </div>
          </AnimateInView>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-border/10">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            © 2003 Komunikasi
          </p>
          <div className="flex gap-6">
            <Link
              href="https://github.com/thirapi"
              target="_blank"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
            >
              GITHUB
            </Link>
            <Link
              href="/signin"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
            >
              SIGN IN
            </Link>
            <Link
              href="/signup"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
