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

## Push notification: FCM (native) + VAPID (web)

Web Push tidak bisa menjangkau app native. Native Android memakai **Firebase
Cloud Messaging** (HTTP v1 — API `fcm/send` yang lama sudah dimatikan Google).

**Keduanya hidup berdampingan** di tabel `PushSubscription`, dibedakan kolom
`type`:

| `type` | transport | menjangkau |
|---|---|---|
| `web` | VAPID (`web-push`) | browser, desktop |
| `fcm` | Firebase Cloud Messaging | app native Android |

> **FCM dikirim oleh Google Play Services.** Perangkat tanpa GMS — Huawei
> yang marak di Indonesia, atau ROM yang di-degoogle — **tidak akan pernah**
> menerima FCM. Itu bukan bug, memang tidak ada layanan pengirimnya. Web Push
> tetap menjadi jalur untuk perangkat itu, jadi tidak ada yang kehilangan
> notifikasi.

### Setup (perlu login Firebase, 10 menit)

1. [Firebase Console](https://console.firebase.google.com) → **Add project**
2. **Add Android app** → package name persis: **`qzz.io.komunikasi`**
   (download `google-services.json` → taruh di `android/app/`)
3. **Project settings → Service accounts → Generate new private key**
4. Isi `.env` dengan isi JSON tersebut:

```
FIREBASE_PROJECT_ID=<id>
FIREBASE_CLIENT_EMAIL=<...@...iam.gserviceaccount.com>
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Lalu `npm run db:push` (menambah kolom `type`, dan `p256dh`/`auth` jadi
nullable), deploy, dan rebuild APK.

Tanpa ketiganya, `FcmPushService.isConfigured()` bernilai false, pengiriman
FCM dilewati tanpa error, dan aplikasi tetap jalan dengan Web Push.

### Perilaku

- Permission Android 13+ (`POST_NOTIFICATIONS`) diminta saat app dibuka
- Token yang ditolak FCM (`UNREGISTERED`/`INVALID_ARGUMENT`) **dihapus** dari
  database, jadi tabel tidak tumbuh dan tidak mengulang ke target mati
- Kegagalan sementara (network, 500) **tidak** menghapus token

### Biaya

Tidak ada biaya. FCM dan Google Play Services gratis untuk use case ini.


## Yang belum terverifikasi

Semua di atas terverifikasi di sisi web (build, 59 test, `tsc`, lint, smoke test
route) dan APK-nya **berhasil dibangun** (8.1 MB, 6 plugin ter-*register*,
permission FCM sudah otomatis masuk). Yang **belum** terverifikasi: pengiriman FCM sungguhan
(karena butuh project Firebase), perangkat tanpa GMS, dan perilaku back button
di perangkat fisik.


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
