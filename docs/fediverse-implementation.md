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
*   **Actor Profile (`api/users/[username]`)**: Endpoint profil publik yang menyajikan kunci publik dan alamat inbox/outbox.
*   **Automated Key Generation**: 
    *   Setiap user baru otomatis mendapatkan Public/Private key saat mendaftar.
    *   User lama mendapatkan kunci secara otomatis saat melakukan Sign-in pertama kali.

### 2. Security Layer (HTTP Signatures)
*   **Outgoing Signatures**: Setiap request yang dikirim ke server luar ditandatangani secara digital menggunakan `privateKey` user.
*   **Incoming Verification**: Inbox kita memvalidasi tanda tangan digital dari server pengirim. Request tanpa tanda tangan sah akan ditolak (`401 Unauthorized`).
*   **Digest Header**: Implementasi hashing SHA-256 pada body request untuk memastikan integritas data.

### 3. Communication Layer (Inbox & Outbox)
*   **Inbox Endpoint (`api/users/[username]/inbox`)**: 
    *   Menerima aktivitas `Follow` dan `Undo Follow`.
    *   Otomatis melakukan "Handshake" dengan mengirim balik aktivitas `Accept` yang sah.
*   **Broadcast Engine**: 
    *   `ActivityPubService` otomatis men-generate objek `Note` setiap kali user membuat postingan.
    *   Sistem akan mengirimkan postingan tersebut ke seluruh `inbox` pengikut luar secara asinkron.

### 4. Data Layer (Persistence)
*   **`RemoteActor` Table**: Menyimpan metadata user dari instance luar (username, domain, inbox URL, public key).
*   **`Follower` Table Updates**: Mendukung hubungan lintas-server (Remote Follower -> Local User).

## 🚧 Fitur yang BELUM Diimplementasikan (Roadmap)

1.  **Remote Follow (Outgoing Follow)**: 
    *   Belum ada UI/Logic untuk mencari user luar dan mengirimkan request `Follow` ke mereka.
2.  **Inbox Processing (Replies & Likes)**: 
    *   Data `Reply` dan `Like` dari luar sudah masuk ke Inbox, tapi belum diproses untuk disimpan ke database lokal sebagai komentar atau reaksi.
3.  **Background Queues**: 
    *   Saat ini pengiriman (broadcast) dilakukan secara langsung (fire-and-forget). Untuk skala besar, diperlukan sistem antrian (seperti BullMQ atau Redis) agar tidak membebani performa API.
4.  **Shared Inbox Support**: 
    *   Optimasi pengiriman ke instance yang sama melalui satu endpoint tunggal (Shared Inbox) belum sepenuhnya diaktifkan.
5.  **Media Synchronization**: 
    *   Pengiriman attachment (gambar/video) agar bisa tampil dengan benar di instance lain.

## 🛠️ Cara Melanjutkan
1.  **Database Migration**: Jalankan migrasi Drizzle untuk tabel `RemoteActor` dan perubahan kolom pada `Follower`.
2.  **Environment Variables**: Pastikan `NEXT_PUBLIC_APP_URL` terkonfigurasi dengan domain publik (harus HTTPS agar bisa berkomunikasi dengan Mastodon).
3.  **Testing**: Gunakan alat seperti [ActivityPub Validator](https://activitypub.rocks/) atau buat akun Mastodon di instance publik untuk mencoba me-follow user dari platform ini.

---
*Dokumentasi dibuat oleh Gemini CLI - Mei 2026*
