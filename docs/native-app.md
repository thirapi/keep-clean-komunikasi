# Aplikasi Native (Capacitor)

Shell native untuk iOS dan Android yang membungkus app Next.js yang sama.

## Kenapa memuat URL, bukan bundle lokal

App ini mengekspos **52 Server Action** di 12 modul `"use server"`. Server
Action hanya bisa dipanggil dari dalam server Next.js yang sedang berjalan,
sehingga `output: "export"` **tidak mungkin** — seluruh lapisan data akan hilang.

Karena itu `capacitor.config.ts` menunjuk WebView ke deployment Vercel:

```ts
server: {
  url: process.env.CAPACITOR_APP_URL ?? "https://komunikasi.qzz.io",
  cleartext: false,   // tanpa ini WebView kehilangan secure context:
                      // IndexedDB, WebCrypto, dan service worker mati
  androidScheme: "https",
}
```

Konsekuensinya: app butuh jaringan saat dibuka (wajar untuk app chat), dan
tidak ada offline shell. Zero perubahan backend.

## Yang sudah terpasang

| Plugin | Fungsi |
|---|---|
| `@capacitor/status-bar` | Status bar ikut tema, tidak overlaid |
| `@capacitor/splash-screen` | Native launch screen |
| `@capacitor/app` | Tombol back hardware → `router.back()`, keluar di root |
| `@capacitor/keyboard` | Body resize, input chat tidak tertutup keyboard |
| `@capacitor/haptics` | Getaran saat pesan masuk / terkirim |

Haptic dipanggil di `realtime-notification-listener.tsx` (pesan masuk) dan
`message-input.tsx` (pesan terkirim).

**Biaya di web:** +1–3 KB raw / +0.3–1.3 KB gzip per route. Semua import plugin
sengaja dinamis, dan `NativeShell` dimuat lewat `next/dynamic` dengan
`ssr:false`, sehingga browser tidak pernah mengunduh runtime Capacitor.

## Menjalankan

Butuh **macOS + Xcode** (iOS) atau **Android Studio** (Android). Di Linux
tanpa toolchain tersebut, `cap sync` tetap jalan tetapi build `.ipa`/`.apk`
tidak bisa.

```bash
npm run cap:sync            # setelah ubah plugin
npm run cap:open:ios        # buka Xcode
npm run cap:run:android     # jalankan di emulator/perangkat
```

## Push notification — belum selesai, dan ini prasyaratnya

Saat ini push memakai **Web Push (VAPID)**, yang punya batas platform iOS:
hanya jalan setelah app di-install ke home screen, dan iOS tidak memberi
kendali atas kapan user offered install.

Untuk native push yang benar:

1. `@capacitor/push-notifications` (belum dipasang)
2. Apple Developer account + APNs auth key (`.p8`) → masuk ke Xcode
3. `@capacitor/app` + `@capacitor/device` untuk device token
4. Server: ganti `web-push` (`src/lib/infrastructure/services/web-push.service.ts`)
   dengan APNs/FCM, sementara service Web Push tetap dipakai untuk web

Butuh keputusan produk lebih dulu: apakah user **wajib** install app untuk
menerima push, atau web & native boleh berbeda perilaku.

## Risiko review App Store

Apple Guideline 4.2 (Minimum Functionality) menolak app yang hanya
"repackaged website". Kapasitas yang/mm drew kebijakan ini: native push,
haptics, share, dan native navigation. Kalau review menolak, opsi yang tersedia
adalah menambah plugin native (share sheet, camera, contacts) atauális
mengganti presentasi web di dalam app.

## Belum terverifikasi

Semua yang di atas terverifikasi di sisi web (build, 53 test, `tsc`, lint,
smoke test route). Yang **belum** terverifikasi karena butuh toolchain native:
build `.ipa`/`.apk`, perilaku back button di perangkat asli, safe area di
iPhone notch/Dynamic Island, dan keyboard overlap.
