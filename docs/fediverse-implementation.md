# Fediverse Implementation Status & Technical Documentation

Dokumen ini mencatat status implementasi protokol Fediverse (ActivityPub) pada platform Komunikasi per Mei 2026.

## 🏗️ Arsitektur & Teknologi

Implementasi ini mengikuti standar **Clean Architecture** yang sudah ada di proyek, dengan beberapa pilihan teknologi spesifik:

1.  **Identity & Security**: 
    *   **Native Crypto**: Menggunakan modul `crypto` bawaan Node.js untuk RSA Key Generation dan HTTP Signatures (RSA-SHA256).
    *   **RSA 2048-bit**: Standar industri untuk interoperabilitas dengan Mastodon dan instance Fediverse lainnya.
    *   **Authorized Fetch (Signed GET)**: Implementasi pengambilan data (aktor, koleksi, outbox) yang ditandatangani secara digital untuk kompatibilitas dengan instance yang mengaktifkan mode aman (seperti Misskey dan Mastodon Authorized Fetch).
2.  **Protocol**: **ActivityPub** (W3C Standard) menggunakan format JSON-LD (`application/activity+json`).
3.  **Persistence**: Drizzle ORM dengan tabel tambahan untuk `RemoteActor` (mendukung kolom `jsonb` untuk metadata kaya) dan modifikasi pada tabel `Follower`.
4.  **Content Parsing**: Pipeline transformasi konten kustom untuk menangani elemen unik Fediverse seperti emoji kustom dan tautan semantik.

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
*   **Full Inbox processing**: Menangani aktivitas masuk: `Follow`, `Undo`, `Like`, `Create` (Note), `Delete`, dan `Announce` (Repost).
*   **Outgoing Interactions**: 
    *   **Likes**: Pengiriman aktivitas `Like` dan `Undo Like` ke server remote.
    *   **Reposts**: Pengiriman aktivitas `Announce` dan `Undo Announce` (Unrepost).
    *   **Replies**: Pengiriman aktivitas `Create` (Note) dengan kolom `inReplyTo` yang valid.
*   **Direct Delivery**: Saat membalas postingan remote, aktivitas kini dikirimkan **langsung** ke inbox penulis aslinya (selain ke followers), memastikan notifikasi dan threading bekerja dengan benar di instance lawan.

### 4. Synchronization & Interop Layer (Data Integrity)
*   **Thread Healing (Chain Fetching)**: Saat menerima balasan ke postingan yang belum ada di database, sistem melakukan *signed fetch* secara rekursif ke URI induk (hingga 10 level) untuk membangun pohon percakapan yang lengkap secara otomatis.
*   **Conversation Context Tracking**: Menyimpan properti `context` atau `conversation` dari ActivityPub untuk memungkinkan pengelompokan utas yang cepat dan efisien tanpa kueri rekursif berat.
*   **Modern Quote Post Support (FEP-e232 & Misskey)**: 
    *   Mendukung standar **FEP-e232 (Object Links)** yang digunakan oleh Mastodon 4.3+ melalui pemindaian array `tag` untuk relasi `quote`.
    *   Dukungan penuh untuk properti `quoteUrl` dan `_misskey_quote` dari ekosistem Misskey/Firefish.
    *   Integrasi properti `quoteOf` untuk kompatibilitas dengan Fedibird dan Pleroma.
*   **Remote Repost Handling**: Mendukung aktivitas `Announce`. Jika kita menerima repost untuk kiriman yang belum kita kenal, sistem otomatis menarik metadata kiriman asli tersebut agar dapat dirender dengan konteks yang benar.
*   **Custom Emoji Mapping**: Mengekstrak metadata emoji dari field `tag` pada kiriman dan profil remote. Metadata disimpan di kolom `jsonb` dan dipetakan ke teks `:shortcode:` saat rendering.
*   **Surgical Content Cleaning**: Pipeline pembersihan konten yang agresif menggunakan regex multiline-safe untuk menghapus penanda fallback "RE: [URL]" yang redundan, memastikan UI tetap bersih dan hanya menampilkan konten asli pengguna.

### 5. Security Hardening (Outbound Protection)
*   **SSRF Protection**: Setiap request outbound divalidasi secara ketat untuk mencegah serangan *Server-Side Request Forgery*. Sistem memblokir akses ke IP privat (127.0.0.1, 192.168.x.x, dll), hostname `localhost`, dan hanya mengizinkan protokol `https:`.
*   **Recursion Depth Limiting**: Resolusi thread otomatis dibatasi maksimal hingga 10 level kedalaman untuk mencegah serangan *infinite loop* utas dan penggunaan resource berlebih.
*   **Concurrent Fetch Locking**: Mekanisme *in-memory lock* untuk mencegah pengambilan data duplikat secara simultan untuk URI yang sama, mengoptimalkan bandwidth dan beban pada server remote.
*   **Strict Content-Type Validation**: Memastikan setiap respons dari server luar adalah valid JSON-LD (`application/activity+json`) sebelum melakukan pemrosesan data.

### 6. UI/UX Layer (User Interface)
*   **Federated vs Local Timeline**: Header timeline kini memiliki tab untuk memisahkan antara feed "Federasi" (semua kiriman) dan "Lokal" (hanya user di instance kita).
*   **Tab Persistence**: Posisi tab timeline (Lokal/Federasi) disimpan dalam URL `?tab=`, sehingga tidak hilang saat halaman di-refresh.
*   **Emoji Rendering**: Integrasi `parseFediverseContent` yang merender emoji kustom di nama tampilan pengguna, bio, dan isi postingan secara proporsional.
*   **HTML & Fediverse Rendering**: Implementasi `rehype-raw` pada pipeline konten untuk merender tag HTML secara aman (`<p>`, `<a>`, `<span>`) yang dikirim dari instance luar. 
*   **Manual Refresh**: Tombol refresh (🔄) di header timeline untuk memperbarui data secara instan dengan indikator loading animasi.
*   **Real-time Hover Cards**: Kartu profil yang muncul saat kursor berada di atas nama pengguna, menampilkan data real-time (bio, banner, stats) dan tombol Ikuti/Batal Ikuti yang sinkron.

## 🚧 Fitur yang BELUM Diimplementasikan (Roadmap)

1.  **Background Queues**: Migrasi ke BullMQ untuk pengiriman aktivitas agar tidak membebani request utama dan mendukung retry otomatis.
2.  **Shared Inbox**: Optimasi pengiriman ke instance besar untuk menghemat bandwidth.
3.  **Media Proxy (Backend)**: Mengalihkan semua request gambar remote melalui endpoint proxy internal untuk privasi dan melewati restriksi CORS secara permanen.

## 🛠️ Perubahan Terbaru & Solusi Masalah
*   **Modern Interaction Standards**: Mengadopsi **FEP-e232** dan **_misskey_quote** untuk mendukung *Quote Post* secara native, menghilangkan sisa teks fallback yang mengganggu.
*   **Advanced Thread Healing**: Menambahkan resolusi rekursif berbasis **Conversation Context** yang jauh lebih cepat dan akurat dalam membangun pohon percakapan dari instance luar.
*   **Security First**: Mengimplementasikan proteksi **SSRF**, batas kedalaman rekursi, dan *locking* request untuk menjaga integritas sistem dan mencegah penyalahgunaan resource.
*   **Robust Content Cleaning**: Memperbarui regex parser untuk membersihkan sisa HTML redundan dari instance Misskey/Mastodon, memastikan konten federasi tampil setara dengan konten lokal.

---
*Dokumentasi diperbarui oleh Gemini CLI - Mei 2026*
