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
*   **Case-Insensitive Resolution**: Pencarian handle dan domain sekarang bersifat *case-insensitive* untuk mencegah duplikasi data.
*   **Rich Actor Profile (`api/users/[username]`)**: Endpoint profil publik yang menyajikan kunci publik dan koleksi Followers/Following.
*   **Automated Key Generation**: Setiap user baru/lama otomatis mendapatkan Public/Private key secara transparan.

### 2. Security Layer (HTTP Signatures)
*   **Outgoing Signatures**: Setiap request (GET/POST) ke server luar ditandatangani menggunakan `privateKey` aktor lokal.
*   **Incoming Verification**: Inbox memvalidasi tanda tangan digital dari server pengirim untuk setiap aktivitas.
*   **Signed Fetch**: Pengambilan objek remote (Post, Actor) selalu menyertakan tanda tangan digital aktor lokal untuk melewati restriksi server Fediverse yang aman.
*   **Robust User-Agent**: Menggunakan User-Agent yang menggabungkan identitas asli aplikasi dengan *compatibility hint* (Mozilla/5.0 dan Mastodon identification) untuk menghindari blokir WAF/Cloudflare pada instance *strict* seperti Misskey.
*   **Signed WebFinger**: Resolusi handle via WebFinger kini menggunakan *signed fetch* sebagai standar, dengan *fallback* otomatis ke *unsigned fetch* jika diperlukan.

### 3. Interaction Layer (Bidirectional Activity)
*   **Full Inbox processing**: Menangani aktivitas masuk: `Follow`, `Undo`, `Like`, `Create` (Note), dan `Delete`.
*   **Outgoing Interactions**: 
    *   **Likes**: Pengiriman aktivitas `Like` dan `Undo Like` ke server remote.
    *   **Reposts**: Pengiriman aktivitas `Announce` dan `Undo Announce` (Unrepost).
    *   **Replies**: Pengiriman aktivitas `Create` (Note) dengan kolom `inReplyTo` yang valid.
*   **Direct Delivery**: Saat membalas postingan remote, aktivitas kini dikirimkan **langsung** ke inbox penulis aslinya (selain ke followers), memastikan notifikasi dan threading bekerja dengan benar di instance lawan.

### 4. Synchronization Layer (Data Integrity)
*   **Multi-ID Alias Support**: Mendukung identifikasi aktor remote melalui berbagai variasi URI (misal: Mastodon `/users/user` vs `/@user`). Feed profil akan menggabungkan semua postingan dari alias URI yang sama.
*   **Deep Outbox Sync**: Sinkronisasi otomatis hingga 40 postingan terbaru saat profil remote dikunjungi, termasuk pemetaan relasi parent-child untuk balasan.
*   **Visibility Mapping**: Mendukung tampilan postingan `public` dan `unlisted` dari instance remote di timeline dan profil.
*   **Enhanced Stats Fetching**: Pengambilan jumlah pengikut (followers/following) kini memprioritaskan atribut asli Mastodon (`followersCount`, `followingCount`) untuk akurasi data yang lebih baik dibandingkan metode hitung koleksi manual.

### 5. UI/UX Layer (User Interface)
*   **HTML & Fediverse Rendering**: Implementasi `rehype-raw` pada pipeline konten untuk merender tag HTML secara aman (`<p>`, `<a>`, `<span>`) yang dikirim dari instance luar. Mendukung styling khusus untuk hashtag dan mention Fediverse.
*   **Standardized Header**: Username (bold) dan Handle (muted) tampil dalam satu baris horizontal yang rapi di seluruh aplikasi.
*   **Focused View**: Tampilan postingan detail menggunakan format vertikal yang lebih lega untuk keterbacaan, lengkap dengan timestamp detail dan status interaksi yang presisi.
*   **Real-time Hover Cards**: Kartu profil yang muncul saat kursor berada di atas nama pengguna, menampilkan data real-time (bio, banner, stats) dan tombol Ikuti/Batal Ikuti yang sinkron.
*   **Toploader Support**: Seluruh navigasi antar profil menggunakan komponen `<Link>` untuk memberikan feedback loading bar yang konsisten.
*   **Action Menu**: Dropdown menu pada postingan menyediakan opsi "Salin Tautan", "Laporkan" (post remote), dan "Hapus" (post lokal).

## 🚧 Fitur yang BELUM Diimplementasikan (Roadmap)

1.  **Background Queues**: Migrasi ke BullMQ untuk pengiriman aktivitas agar tidak membebani request utama dan mendukung retry otomatis.
2.  **Shared Inbox**: Optimasi pengiriman ke instance besar untuk menghemat bandwidth.
3.  **Media Proxy**: Menampilkan media dari instance luar dengan melewati batasan CSP/CORS melalui server proxy lokal.

## 🛠️ Perubahan Terbaru & Solusi Masalah
*   **Fix Empty Remote Profile**: Masalah profil kosong diatasi dengan implementasi **Multi-ID Alias** dan pencarian **Case-Insensitive** di `PostRepository`.
*   **Interaction Propagation**: Memperbaiki isu Like/Reply tidak muncul di Mastodon dengan mengaktifkan pengiriman aktivitas yang ditandatangani secara digital ke inbox remote.
*   **UI Alignment**: Menyelaraskan layout header post agar username, handle, dan metadata waktu berada di posisi horizontal yang sejajar.

---
*Dokumentasi diperbarui oleh Gemini CLI - Mei 2026*
