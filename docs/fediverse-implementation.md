# Fediverse Implementation Status & Technical Documentation

Dokumen ini mencatat status implementasi protokol Fediverse (ActivityPub) pada platform Komunikasi per Mei 2026.

## 🏗️ Arsitektur & Teknologi

Implementasi ini mengikuti standar **Clean Architecture** yang sudah ada di proyek, dengan beberapa pilihan teknologi spesifik:

1.  **Identity & Security**: 
    *   **Native Crypto**: Menggunakan modul `crypto` bawaan Node.js untuk RSA Key Generation dan HTTP Signatures (RSA-SHA256). Pilihan ini diambil untuk menghindari dependensi eksternal yang berat dan menjaga keamanan tingkat rendah.
    *   **RSA 2048-bit**: Standar industri untuk interoperabilitas dengan Mastodon dan instance Fediverse lainnya.
2.  **Protocol**: **ActivityPub** (W3C Standard) menggunakan format JSON-LD (`application/activity+json`).
3.  **Persistence**: Drizzle ORM dengan tabel tambahan untuk `RemoteActor` dan modifikasi pada tabel `Follower`.

## ✅ Fitur yang SUDAH Diimplementasikan

### 1. Identity Layer (Identity & Discovery)
*   **WebFinger (`.well-known/webfinger`)**: Discovery protocol agar user dapat dicari dengan format `@user@domain.com`.
*   **Rich Actor Profile (`api/users/[username]`)**: 
    *   Endpoint profil publik yang menyajikan kunci publik.
    *   Menampilkan **Avatar** dan **Banner** secara absolut.
    *   Menyertakan **Tanggal Bergabung** (`published`) yang akurat.
    *   Menyediakan koleksi **Followers** and **Following**.
*   **Automated Key Generation**: 
    *   Setiap user baru otomatis mendapatkan Public/Private key saat mendaftar.
    *   User lama mendapatkan kunci secara otomatis saat melakukan Sign-in pertama kali.

### 2. Security Layer (HTTP Signatures)
*   **Outgoing Signatures**: Setiap request yang dikirim ke server luar ditandatangani secara digital menggunakan `privateKey` user.
*   **Incoming Verification**: Inbox kita memvalidasi tanda tangan digital dari server pengirim. Request tanpa tanda tangan sah akan ditolak (`401 Unauthorized`).
*   **410 Gone Resilience**: Sistem memiliki logika toleransi khusus untuk aktivitas `Delete`. Jika aktor pengirim sudah tidak ditemukan (410 Gone), sistem tetap memberikan respon `202 Accepted` untuk mencegah loop pengiriman ulang dari server asal.
*   **Digest Header**: Implementasi hashing SHA-256 pada body request untuk memastikan integritas data.

### 3. Communication Layer (Inbox & Outbox)
*   **Standardized User-Agent**: Seluruh request keluar menggunakan User-Agent yang robust (`Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)`) untuk menghindari pemblokiran oleh sistem proteksi bot/Cloudflare pada instance luar.
*   **WebFinger Encoding**: Implementasi `encodeURIComponent` pada parameter resource untuk kompatibilitas penuh dengan berbagai jenis server Fediverse.
*   **Inbox Processing (Replies & Likes)**: 
    *   Menerima dan menyimpan balasan (`Note` with `inReplyTo`) dari luar sebagai komentar lokal.
    *   Menerima dan memproses aktivitas `Like` dari remote actor.
    *   Mendukung aktivitas `Delete` baik untuk aktor maupun postingan secara real-time.
    *   Mendukung penyimpanan otomatis postingan baru dari actor yang diikuti.
*   **Outbox Endpoint (`api/users/[username]/outbox`)**:
    *   Menyajikan 20 postingan terakhir user dalam format `OrderedCollection`.
    *   Memungkinkan instance lain (Mastodon, dll) untuk menarik dan menampilkan postingan lama user di profil mereka.
*   **Broadcast Engine**: 
    *   `ActivityPubService` otomatis men-generate objek `Note` setiap kali user membuat postingan.
    *   Sistem akan mengirimkan postingan tersebut ke seluruh `inbox` pengikut luar secara asinkron.
    *   Mendukung lampiran media (`attachments`) pada postingan keluar.

### 4. Data Layer (Persistence)
*   **`RemoteActor` Table**: Menyimpan metadata user dari instance luar (username, domain, inbox URL, public key).
*   **`Follower` Table Updates**: Mendukung hubungan lintas-server (Remote Follower -> Local User dan Local User -> Remote Actor).
*   **Following Feed Integration**: Feed "Mengikuti" kini mencakup postingan dari remote actor yang diikuti oleh user.

## 🚧 Fitur yang BELUM Diimplementasikan (Roadmap)

1.  **Remote Follow UI Improvement**: 
    *   Meskipun backend sudah mendukung, UI untuk menampilkan profil remote actor sebelum follow bisa ditingkatkan.
2.  **Background Queues** (**Penting untuk Skalabilitas**): 
    *   Menggunakan Redis/BullMQ untuk pengiriman aktivitas. Saat pengikut mencapai ratusan, pengiriman sinkron akan membuat aplikasi terasa lambat atau timeout.
3.  **Shared Inbox Support**: 
    *   Optimasi pengiriman ke instance yang sama (misal 100 pengikut di `mastodon.social`) melalui satu request tunggal.

## 🛠️ Cara Melanjutkan
1.  **Environment Variables**: Pastikan `NEXT_PUBLIC_APP_URL` terkonfigurasi dengan domain publik (harus HTTPS agar bisa berkomunikasi dengan Mastodon).
2.  **Testing**: Gunakan akun Mastodon di instance publik untuk mencoba me-follow user dari platform ini dan pastikan interaksi (Like/Reply) muncul dengan benar.

---
*Dokumentasi diperbarui oleh Gemini CLI - Mei 2026*
