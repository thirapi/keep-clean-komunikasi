import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import { AnimatedButton } from "@/components/landingpage/animated-button";
import K from "@/components/icons/k";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <K className="h-6 w-6" />
            <span className="text-xl font-bold">Komunikasi</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="hidden md:flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <AnimatedButton asChild>
                <Link href="/signup">Sign Up</Link>
              </AnimatedButton>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-background text-foreground transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Text Content */}
              <AnimateInView direction="left" delay={0.1}>
                <div className="flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                      Komunikasi
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-xl">
                      Web Chat App
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <AnimatedButton size="lg" asChild>
                      <Link href="/signup">Sign Up</Link>
                    </AnimatedButton>
                    <AnimatedButton size="lg" variant="outline" asChild>
                      <Link href="/signin">Sign In</Link>
                    </AnimatedButton>
                  </div>
                </div>
              </AnimateInView>

              {/* SVG / Image */}
              <AnimateInView direction="right" delay={0.3}>
                <div className="flex justify-center items-center">
                  <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg aspect-square">
                    <K className="w-full h-full text-primary stroke-[1.5] transition duration-300 hover:scale-105" />
                  </div>
                </div>
              </AnimateInView>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="w-full max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 flex-col gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <K className="h-5 w-5" />
            <p className="text-sm text-muted-foreground">
              © 2003 Komunikasi. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Sign Up
            </Link>
            <Link
              href="https://github.com/thirapi"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
