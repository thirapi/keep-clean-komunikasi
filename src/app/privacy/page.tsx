import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { AnimateInView } from "@/components/landingpage/animate-in-view";
import Head from "next/head";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Kebijakan Privasi | Komunikasi</title>
        <meta
          name="description"
          content="Baca kebijakan privasi Komunikasi untuk memahami bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Kebijakan Privasi | Komunikasi" />
        <meta
          property="og:description"
          content="Kami berkomitmen menjaga privasi dan keamanan data pengguna kami."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://komunikasi.qzz.io/privacy"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Kebijakan Privasi",
              url: "https://komunikasi.qzz.io/privacy",
              description:
                "Baca kebijakan privasi Komunikasi untuk memahami bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
            }),
          }}
        ></script>
      </Head>
      <div className="flex min-h-screen flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-xl font-bold">Komunikasi</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Kembali ke Beranda</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Header Section */}
          <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/50">
            <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
              <AnimateInView direction="up" delay={0.1}>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Kebijakan Privasi
                  </h1>
                  <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                    Kami berkomitmen untuk menjaga privasi dan keamanan data
                    pengguna kami.
                  </p>
                </div>
              </AnimateInView>
            </div>
          </section>

          {/* Content Section */}
          <section className="w-full py-12 md:py-16">
            <div className="flex justify-center">
              <AnimateInView direction="up" delay={0.2}>
                <Card className="w-full max-w-4xl p-6 md:p-8 lg:p-10">
                  <div className="space-y-10">
                    {/* Section 1 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Informasi yang Kami Kumpulkan
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Kami mengumpulkan informasi yang Anda berikan secara
                          langsung kepada kami saat Anda mendaftar dan
                          menggunakan layanan kami. Informasi ini meliputi:
                        </p>
                        <ul className="ml-6 list-disc space-y-1">
                          <li>
                            Informasi akun seperti nama, alamat email, dan kata
                            sandi
                          </li>
                          <li>
                            Konten yang Anda kirim melalui layanan kami, seperti
                            pesan chat dan file
                          </li>
                          <li>
                            Informasi penggunaan seperti waktu akses, fitur yang
                            digunakan, dan interaksi dengan layanan kami
                          </li>
                          <li>
                            Informasi perangkat seperti jenis perangkat, sistem
                            operasi, dan pengidentifikasi perangkat unik
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Bagaimana Kami Menggunakan Informasi
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Kami menggunakan informasi yang kami kumpulkan untuk:
                        </p>
                        <ul className="ml-6 list-disc space-y-1">
                          <li>
                            Menyediakan, memelihara, dan meningkatkan layanan
                            kami
                          </li>
                          <li>Memproses dan menyelesaikan transaksi</li>
                          <li>
                            Mengirim informasi teknis, pembaruan, peringatan
                            keamanan, dan pesan dukungan
                          </li>
                          <li>
                            Menanggapi komentar, pertanyaan, dan permintaan Anda
                          </li>
                          <li>
                            Memantau dan menganalisis tren, penggunaan, dan
                            aktivitas yang terkait dengan layanan kami
                          </li>
                          <li>
                            Mendeteksi, menyelidiki, dan mencegah aktivitas
                            penipuan dan pelanggaran lainnya
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Penyimpanan dan Keamanan Data
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Keamanan data Anda sangat penting bagi kami. Kami
                          mengimplementasikan langkah-langkah keamanan teknis
                          dan organisasi yang dirancang untuk melindungi
                          informasi Anda, termasuk:
                        </p>
                        <ul className="ml-6 list-disc space-y-1">
                          <li>
                            Enkripsi end-to-end untuk pesan dan file yang
                            dikirim melalui platform kami
                          </li>
                          <li>
                            Penyimpanan data yang aman dengan kontrol akses yang
                            ketat
                          </li>
                          <li>
                            Pemantauan sistem secara teratur untuk mendeteksi
                            kerentanan dan potensi pelanggaran
                          </li>
                          <li>
                            Pelatihan staf tentang praktik keamanan data dan
                            privasi
                          </li>
                        </ul>
                        <p className="mt-4">
                          Kami menyimpan data Anda hanya selama diperlukan untuk
                          menyediakan layanan yang Anda minta dan untuk tujuan
                          yang dijelaskan dalam kebijakan privasi ini. Ketika
                          kami tidak lagi memerlukan data pribadi Anda, kami
                          akan menghapusnya atau mengaburkannya sehingga tidak
                          lagi dapat mengidentifikasi Anda.
                        </p>
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Hak Pengguna
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Anda memiliki hak tertentu terkait dengan data pribadi
                          Anda, termasuk:
                        </p>
                        <ul className="ml-6 list-disc space-y-1">
                          <li>
                            Hak untuk mengakses data pribadi yang kami simpan
                            tentang Anda
                          </li>
                          <li>
                            Hak untuk meminta koreksi data pribadi yang tidak
                            akurat
                          </li>
                          <li>
                            Hak untuk meminta penghapusan data pribadi Anda
                          </li>
                          <li>
                            Hak untuk membatasi pemrosesan data pribadi Anda
                          </li>
                          <li>
                            Hak untuk meminta salinan data pribadi Anda dalam
                            format yang dapat dibaca mesin
                          </li>
                          <li>
                            Hak untuk menolak pemrosesan data pribadi Anda untuk
                            tujuan tertentu
                          </li>
                        </ul>
                        <p className="mt-4">
                          Untuk menggunakan hak-hak ini, silakan hubungi kami
                          melalui informasi kontak yang disediakan di bawah.
                        </p>
                      </div>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Perubahan terhadap Kebijakan Privasi
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Kami dapat memperbarui kebijakan privasi ini dari
                          waktu ke waktu untuk mencerminkan perubahan pada
                          praktik kami atau untuk alasan operasional, hukum,
                          atau peraturan lainnya. Kami akan memberi tahu Anda
                          tentang perubahan apa pun dengan memposting kebijakan
                          privasi baru di situs web kami dan, jika perubahan
                          signifikan, kami akan memberi tahu Anda melalui email
                          atau melalui pemberitahuan dalam aplikasi.
                        </p>
                        <p className="mt-4">
                          Kami mendorong Anda untuk meninjau kebijakan privasi
                          ini secara berkala untuk mendapatkan informasi terbaru
                          tentang praktik privasi kami.
                        </p>
                      </div>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Kontak
                      </h2>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          Jika Anda memiliki pertanyaan, komentar, atau
                          kekhawatiran tentang kebijakan privasi ini atau
                          praktik privasi kami, silakan hubungi kami di:
                        </p>
                        <div className="mt-4 space-y-1">
                          <p>Email: privacy@komunikasi.com</p>
                          <p>
                            Alamat: Jl. Teknologi No. 123, Jakarta 12345,
                            Indonesia
                          </p>
                          <p>Telepon: +62 21 1234 5678</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 text-center text-sm text-muted-foreground">
                      <p>Terakhir diperbarui: 23 Mei 2024</p>
                    </div>
                  </div>
                </Card>
              </AnimateInView>
            </div>
          </section>
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
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Masuk
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Daftar
              </Link>
              <Link
                href="/#about"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Tentang
              </Link>
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
    </>
  );
}
