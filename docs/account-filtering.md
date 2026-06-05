# Account Filtering: Mute & Reduce Intensity

Sistem Account Filtering memungkinkan pengguna untuk mengontrol pengalaman timeline mereka dengan membatasi atau menyembunyikan konten dari akun tertentu (baik lokal maupun Fediverse).

## Jenis Filter

### 1. Mute (Bisukan)
- **Perilaku**: Seluruh postingan dari akun yang dibisukan akan dihilangkan sepenuhnya dari timeline (Global Feed & Following Feed).
- **Konteks**: Akun tetap bisa diikuti, tetapi aktivitasnya tidak akan muncul kecuali pengguna membuka profil akun tersebut secara langsung.

### 2. Reduce Intensity (Batasi Intensitas)
- **Perilaku**: Membatasi dominasi akun tertentu di timeline tanpa menghilangkannya sepenuhnya. 
- **Aturan Batasan**:
    - Maksimum **2 slot beruntun** untuk aktivitas baru (postingan baru atau boost konten orang lain).
    - Jika akun tersebut memposting lebih dari 2 kali berturut-turut, postingan ke-3 dan seterusnya akan disembunyikan sampai ada postingan dari aktor lain.
- **Thread Integrity**: Fitur ini cerdas dalam menjaga konteks. Jika akun tersebut sedang membuat **utas (thread)** atau **self-boost** konten yang sudah ada dalam blok yang sama, batasan slot tidak akan bertambah. Ini memastikan diskusi panjang tidak terputus di tengah.

## Perilaku Sistem

### Fetching & Data Availability
Postingan dari akun yang dibatasi atau dibisukan **tetap diambil (fetched)** dari server. Hal ini dilakukan karena:
1.  **Thread Healing**: Sistem perlu memvalidasi apakah sebuah postingan adalah bagian dari rangkaian diskusi (reply-to) agar tidak memutus konteks secara tidak sengaja.
2.  **Client-side Filtering**: Filtering dilakukan sesaat sebelum data dirender ke UI untuk memastikan algoritma intensitas berjalan akurat berdasarkan urutan waktu.

### Alert Postingan Baru
Postingan yang disaring oleh aturan Mute atau Reduce Intensity **tidak akan memicu** munculnya alert "N Postingan Baru" di UI. Alert hanya akan muncul jika ada postingan dari akun yang tidak dibatasi atau postingan yang lolos dari batas intensitas.

## Standar UI/UX

### Konfirmasi Pengguna
Setiap aktivasi filter baru (bukan saat mematikan) WAJIB memunculkan modal konfirmasi (`AlertDialog`) untuk edukasi fitur.

### Pencegahan Click Propagation (Tembus)
Untuk mencegah interaksi modal memicu klik pada elemen di belakangnya (seperti masuk ke detail postingan), seluruh komponen modal konfirmasi WAJIB dibungkus dengan wrapper yang menghentikan propagasi event:
```tsx
<div onClick={(e) => e.stopPropagation()}>
    <AlertDialog>...</AlertDialog>
</div>
```

### Desain Minimalis
Sesuai dengan standar estetika aplikasi, modal konfirmasi menggunakan desain minimalis tanpa dekorasi ikon yang berlebihan pada judul, serta menggunakan teks tebal (bold) yang dirender via komponen React (bukan Markdown fallback).

## Arsitektur Teknis

### Domain Logic (`src/lib/application/utils/timeline-filter.ts`)
Logika utama penyaringan intensitas berada di fungsi `filterTimelineIntensity`. Fungsi ini menggunakan *state tracker* untuk memantau:
- `consecutiveSlotsCount`: Jumlah slot yang sudah digunakan oleh aktor terakhir.
- `isContinuation`: Deteksi apakah postingan saat ini adalah kelanjutan (reply/boost) dari postingan sebelumnya oleh aktor yang sama.

### Data Flow
1. **Use Case (`GetGlobalFeedUseCase` / `GetFollowingFeedUseCase`)**:
    - Menggunakan **SQL-level filtering** untuk menyaring akun yang di-Mute melalui Repository. Ini memastikan `limit` dan `offset` database tetap akurat terhadap data yang valid.
    - Menggunakan teknik **Looping Fetch (max 3 attempts)** untuk memastikan kuota `limit` terpenuhi jika ada postingan yang difilter oleh algoritma intensitas di level aplikasi.
    - Melakukan filter "Reduce Intensity" menggunakan utility.
    - Melakukan `slice(0, limit)` untuk mengembalikan jumlah data yang konsisten ke UI.

2. **Repository (`PostRepository`)**:
    - Menerima parameter `excludedUserIds` dan `excludedRemoteActorIds`.
    - Menggunakan `notInArray` di query SQL untuk efisiensi performa.

3. **Real-time Updates**:
    - Setelah filter diubah via UI, query cache React Query di-invalidate (`user-filters` dan `posts`) untuk memberikan feedback instan kepada pengguna.

## Fediverse Compatibility
Sesuai dengan standar interoperabilitas, filter ini berlaku merata baik untuk aktor lokal maupun aktor remote yang datang via ActivityPub.

## Referensi File
- `src/lib/infrastructure/drizzle/schema.ts`: Skema tabel `AccountFilter`.
- `src/lib/application/utils/timeline-filter.ts`: Logika algoritma pembatasan intensitas.
- `src/lib/interface-adapters/controllers/users/toggle-account-filter.controller.ts`: Entry point perubahan filter.
