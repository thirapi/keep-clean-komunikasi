# Rencana Pengembangan Fitur - Keep Clean Komunikasi

Dokumen ini merinci rencana pengembangan fitur aplikasi dalam beberapa fase untuk meningkatkan pengalaman pengguna dan fungsionalitas sistem.

## 🚀 Fase 1: Peningkatan Pengalaman Pesan (Tanpa Perubahan Skema)
Fokus pada peningkatan cara pengguna berinteraksi dengan konten pesan tanpa memodifikasi struktur database inti.

### 1.1 Pencarian Pesan
- **Deskripsi**: Memungkinkan pengguna mencari kata kunci tertentu di dalam riwayat pesan.
- **Fitur**: Pencarian in-room & global, highlight kata kunci.

### 1.2 Dukungan Markdown (Formatting Pesan)
- **Deskripsi**: Mendukung format teks kaya menggunakan sintaks Markdown (bold, italic, code blocks, etc).

### 1.3 Pratinjau Link Umum (Rich Link Previews)
- **Deskripsi**: Menampilkan kartu informasi OpenGraph secara otomatis untuk URL yang dikirim.

---

## 🏗️ Fase 2: Interaksi & Personalisasi (Perubahan Skema Ringan)
Fokus pada fitur sosial dan kustomisasi profil yang membutuhkan penyesuaian pada database.

### 2.1 Reaksi Emoji (Message Reactions)
- **Deskripsi**: Memberikan reaksi emoji langsung pada pesan tertentu.
- **Kebutuhan Skema**: Tabel baru `MessageReaction`.

### 2.2 Pembaruan Profil & Status
- **Deskripsi**: Meningkatkan profil pengguna dengan banner, status kustom, dan bio.
- **Kebutuhan Skema**: Kolom baru pada tabel `User`.

---

## 🔮 Fase 3: Fitur Lanjutan & Optimasi
Fitur-fitur kompleks untuk skalabilitas dan keterlibatan pengguna yang lebih dalam.

### 3.1 Notifikasi Push (Web Push API)
### 3.2 Pesan Disematkan (Pinned Messages)
### 3.3 Galeri Media (Media Gallery)
### 3.4 Pesan Suara (Voice Notes)
### 3.5 Internasionalisasi (Multi-bahasa)

---

## 🛠️ Jadwal Pelaksanaan
| Fase | Status | Target Utama |
| :--- | :--- | :--- |
| **Fase 1** | 🚀 Sedang Berjalan | Search, Markdown, Link Previews |
| **Fase 2** | 💤 Menunggu | Reactions, Profile Enhancements |
| **Fase 3** | 💤 Menunggu | Push Notifications, Pinned, Media, Voice, i18n |
