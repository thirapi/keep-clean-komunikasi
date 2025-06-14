import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ModeToggle } from "@/components/landingpage/mode-toggle";
import { MessageSquare, Zap, Moon, FlameKindling } from "lucide-react";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import { AnimatedButton } from "@/components/landingpage/animated-button";
import { AnimatedCard } from "@/components/landingpage/animated-card";
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
            {/* <nav className="hidden md:flex gap-6">
              <Link
                href="#features"
                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                Fitur
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                Tentang
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                FAQ
              </Link>
            </nav> */}
            <ModeToggle />
            <div className="hidden md:flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/signin">Masuk</Link>
              </Button>
              <AnimatedButton asChild>
                <Link href="/signup">Daftar</Link>
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
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-background">
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
                      <Link href="/signup">Daftar</Link>
                    </AnimatedButton>
                    <AnimatedButton size="lg" variant="outline" asChild>
                      <Link href="/signin">Masuk</Link>
                    </AnimatedButton>
                  </div>
                </div>
              </AnimateInView>

              {/* SVG / Image */}
              <AnimateInView direction="right" delay={0.3}>
                <div className="flex justify-center items-center">
                  <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg aspect-square">
                    <K className="w-full h-full text-primary stroke-[1.5]" />
                  </div>
                </div>
              </AnimateInView>
            </div>
          </div>
        </section>

        {/* Features Section */}
        {/* <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container mx-auto px-4 md:px-6">
            <AnimateInView direction="up" delay={0.1}>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Fitur Utama
                  </h2>
                  <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Komunikasi menyediakan pengalaman chat yang sederhana namun
                    powerful
                  </p>
                </div>
              </div>
            </AnimateInView>
            <div className="grid grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
              <AnimateInView direction="up" delay={0.2}>
                <AnimatedCard>
                  <CardHeader className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Real-time Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Pesan terkirim dan diterima secara instan tanpa delay
                    </CardDescription>
                  </CardContent>
                </AnimatedCard>
              </AnimateInView>
              <AnimateInView direction="up" delay={0.3}>
                <AnimatedCard>
                  <CardHeader className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
                        className="h-10 w-10 text-primary"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M7 7h10" />
                        <path d="M7 12h10" />
                        <path d="M7 17h10" />
                      </svg>
                    </div>
                    <CardTitle>Simple & Intuitive UI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Antarmuka yang mudah digunakan dan tidak membingungkan
                    </CardDescription>
                  </CardContent>
                </AnimatedCard>
              </AnimateInView>
              <AnimateInView direction="up" delay={0.4}>
                <AnimatedCard>
                  <CardHeader className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
                        className="h-10 w-10 text-primary"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m4.9 4.9 14.2 14.2" />
                      </svg>
                    </div>
                    <CardTitle>No Ads, No Distractions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Fokus pada percakapan tanpa gangguan iklan
                    </CardDescription>
                  </CardContent>
                </AnimatedCard>
              </AnimateInView>
              <AnimateInView direction="up" delay={0.5}>
                <AnimatedCard>
                  <CardHeader className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Moon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Dark Mode Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Nyaman digunakan di malam hari dengan mode gelap
                    </CardDescription>
                  </CardContent>
                </AnimatedCard>
              </AnimateInView>
            </div>
          </div>
        </section> */}

        {/* About Section */}
        {/* <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <AnimateInView direction="left" delay={0.2}>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                      Tentang Komunikasi
                    </h2>
                    <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Misi kami adalah menyediakan ruang yang aman dan gratis
                      untuk berkomunikasi secara santai di dunia online.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Komunikasi dibuat dengan fokus pada privasi dan
                      kesederhanaan. Kami percaya bahwa setiap orang berhak
                      untuk berkomunikasi tanpa khawatir data mereka
                      disalahgunakan atau dijual.
                    </p>
                    <p className="text-muted-foreground">
                      Platform kami dirancang untuk menjadi ringan, cepat, dan
                      mudah digunakan oleh siapa saja. Tidak ada fitur yang
                      rumit, hanya fokus pada apa yang penting: menghubungkan
                      orang.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <AnimatedButton variant="outline" asChild>
                      <Link href="#features">Lihat Fitur</Link>
                    </AnimatedButton>
                  </div>
                </div>
              </AnimateInView>
              <AnimateInView direction="right" delay={0.3}>
                <div className="flex items-center justify-center">
                  <div className="relative h-[300px] w-[300px] sm:h-[400px] sm:w-[400px]">
                    <img
                      loading="lazy"
                      src="messages-square.svg"
                      alt="Illustration of people chatting"
                      className="rounded-lg object-cover"
                      width={400}
                      height={400}
                    />
                  </div>
                </div>
              </AnimateInView>
            </div>
          </div>
        </section> */}

        {/* FAQ Section */}
        {/* <section
          id="faq"
          aria-labelledby="faq-heading"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container mx-auto px-4 md:px-6">
            <AnimateInView direction="up" delay={0.1}>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2
                    id="faq-heading"
                    className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                  >
                    Pertanyaan Umum
                  </h2>
                  <p className="mx-auto max-w-3xl text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Jawaban untuk pertanyaan yang sering ditanyakan
                  </p>
                </div>
              </div>
            </AnimateInView>
            <AnimateInView direction="up" delay={0.2}>
              <div className="mx-auto max-w-3xl py-12">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      Apakah Komunikasi benar-benar gratis?
                    </AccordionTrigger>
                    <AccordionContent>
                      Ya, Komunikasi sepenuhnya gratis untuk digunakan. Kami
                      tidak memiliki fitur berbayar atau konten premium. Semua
                      fitur tersedia untuk semua pengguna.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      Bagaimana dengan privasi data saya?
                    </AccordionTrigger>
                    <AccordionContent>
                      Kami sangat menghargai privasi Anda. Kami tidak menjual
                      data pengguna kepada pihak ketiga dan hanya mengumpulkan
                      informasi minimal yang diperlukan untuk menjalankan
                      layanan.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      Apakah saya bisa menggunakan Komunikasi di perangkat
                      mobile?
                    </AccordionTrigger>
                    <AccordionContent>
                      Tentu saja! Komunikasi dirancang dengan responsif dan
                      dapat diakses melalui browser di perangkat apa pun,
                      termasuk smartphone dan tablet.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </AnimateInView>
          </div>
        </section> */}
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="w-full max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 flex-col gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <p className="text-sm text-muted-foreground">
              © 2024 Komunikasi. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Daftar
            </Link>
            {/* <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Tentang
            </Link> */}
            <Link
              href="/privacy"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="https://github.com/Thirapi"
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
