# Fediverse Implementation Status & Technical Documentation

Dokumen ini mencatat status implementasi protokol Fediverse (ActivityPub) pada platform Komunikasi per Mei 2026.

## 🏗️ Arsitektur & Teknologi

Implementasi ini mengikuti standar **Clean Architecture** yang sudah ada di proyek, dengan beberapa pilihan teknologi spesifik:

1.  **Identity & Security**: 
    *   **Native Crypto**: Menggunakan modul `crypto` bawaan Node.js untuk RSA Key Generation dan HTTP Signatures (RSA-SHA256).
    *   **RSA 2048-bit**: Standar industri untuk interoperabilitas dengan Mastodon dan instance Fediverse lainnya.
    *   **Authorized Fetch (Signed GET)**: Implementasi pengambilan data (aktor, koleksi, outbox) yang ditandatangani secara digital untuk kompatibilitas dengan instance yang mengaktifkan mode aman (seperti Misskey dan Mastodon Authorized Fetch).
2.  **Protocol**: **ActivityPub** (W3C Standard) menggunakan format JSON-LD (`application/activity+json`).
3.  **Persistence**: Drizzle ORM dengan tabel tambahan untuk `RemoteActor` dan modifikasi pada tabel `Follower`.

## ✅ Fitur yang SUDAH Diimplementasikan

### 1. Identity Layer (Identity & Discovery)
*   **WebFinger (`.well-known/webfinger`)**: Discovery protocol agar user dapat dicari dengan format `@user@domain.com`. Mendukung URI Encoding untuk kompatibilitas Misskey.
*   **Rich Actor Profile (`api/users/[username]`)**: 
    *   Endpoint profil publik yang menyajikan kunci publik.
    *   Menyediakan koleksi **Followers** and **Following** dengan konten URI yang valid untuk audit lintas-server.
*   **Automated Key Generation**: Setiap user baru/lama otomatis mendapatkan Public/Private key.

### 2. Security Layer (HTTP Signatures)
*   **Outgoing Signatures**: Setiap request (GET/POST) ke server luar ditandatangani menggunakan `privateKey` (melalui `ActivityPubFetchService`).
*   **Incoming Verification**: Inbox memvalidasi tanda tangan digital dari server pengirim.
*   **410 Gone Resilience**: Memberikan respon `202 Accepted` untuk aktivitas `Delete` dari aktor yang sudah tidak ditemukan untuk memutus loop retry.

### 3. Communication Layer (Inbox & Outbox)
*   **Standardized User-Agent**: Seluruh request keluar menggunakan User-Agent standar browser/bot yang robust (`Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)`) untuk meminimalisir blokir Cloudflare.
*   **Inbox Processing**: Mendukung `Follow`, `Undo`, `Like`, `Create` (Note), dan `Delete`.
*   **Full Outbox Stream**: Endpoint outbox menyajikan aktivitas `Create Note` yang valid, memungkinkan Mastodon/Misskey menarik dan menampilkan postingan user lokal.
*   **Remote Post Sync**: Sinkronisasi otomatis postingan remote actor saat profil pertama kali dicari atau dilihat, mendukung paging (CollectionPage) dan variasi format Note/Activity.
*   **Individual Post URIs**: Mendukung pengambilan data postingan individu oleh instance luar melalui URI `/users/[userId]/posts/[postId]`.

### 4. Data Layer (Persistence)
*   **`RemoteActor` Table**: Menyimpan metadata, public key, dan status sinkronisasi.
*   **`Follower` Table**: Mendukung hubungan lintas-server dua arah (Local -> Remote, Remote -> Local) dengan integrasi UI di UserListDialog.

## 🚧 Fitur yang BELUM Diimplementasikan (Roadmap)

1.  **Background Queues**: Migrasi ke BullMQ untuk pengiriman aktivitas agar tidak membebani request utama.
2.  **Shared Inbox**: Optimasi pengiriman ke instance besar untuk menghemat bandwidth.
3.  **Media Proxy**: Menampilkan media dari instance luar seringkali terkendala CSP atau CORS; dibutuhkan proxy lokal.

## 🛠️ Perubahan Terbaru & Solusi Masalah
*   **Bypass 403 Forbidden**: Masalah pada `misskey.id` diatasi dengan standarisasi User-Agent dan implementasi **Signed Fetch** pada WebFinger discovery.
*   **Cross-Instance Followers**: List followers/following sekarang mengembalikan URI aktor yang valid dan ditampilkan dengan handle lengkap di UI.
*   **Post Visibility**: Memperbaiki logika Outbox dan menambahkan endpoint post individu agar postingan user lokal muncul di Mastodon/Misskey.

---
*Dokumentasi diperbarui oleh Gemini CLI - Mei 2026*
