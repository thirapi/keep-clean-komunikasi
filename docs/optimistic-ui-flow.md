# Optimistic UI & Message Lifecycle

Aplikasi ini menggunakan pola **Optimistic UI** untuk memberikan pengalaman chat yang instan dan responsif. Dokumen ini menjelaskan bagaimana pesan dikelola dari saat diketik hingga dikonfirmasi oleh server.

## Lifecycle Pesan

### 1. Fase Optimistik (Client-Side)
Saat pengguna menekan tombol kirim:
- Client menghasilkan `optimisticId` yang unik menggunakan `cuid2`.
- Pesan segera ditambahkan ke state UI dengan properti `isOptimistic: true` dan ID sementara `optimistic-{optimisticId}`.
- Pesan ini muncul di daftar chat dengan visual "sedang mengirim" (opacity dikurangi).
- Request dikirim ke server action `createMessage` dengan menyertakan `optimisticId`.

### 2. Fase Sinkronisasi (Server-Side)
Server menerima request dan:
- Menyimpan pesan ke database dengan ID permanen.
- Menyiapkan objek `MessageWithUserDTO` yang menyertakan kembali `optimisticId` yang diterima dari client.
- Melakukan broadcast melalui Pusher ke channel ruangan.

### 3. Fase Rekonsiliasi (Client-Side)
Client menerima response dari server atau event dari Pusher:
- Client mencari pesan di state lokal menggunakan `optimisticId`.
- Jika ditemukan, pesan optimistik **digantikan** dengan pesan asli dari server (yang sekarang memiliki ID permanen dan timestamp resmi).
- `isOptimistic` disetel ke `false`.

## Penanganan Technical Gap

### Correlation ID (`optimisticId`)
Sebelumnya, sistem menggunakan pencocokan konten teks untuk mengganti pesan optimistik. Hal ini berisiko jika pengguna mengirim pesan yang identik dalam waktu cepat. Dengan `optimisticId`, rekonsiliasi menjadi 100% akurat.

### Read Receipt Constraints (Harden)
Untuk menjaga integritas database (Foreign Key constraints), sistem menerapkan aturan ketat pada status "sudah dibaca":
- **ID Real Saja:** Client dilarang mengirim `optimisticId` ke server sebagai `lastReadMessageId`. Jika pesan terakhir di chat adalah pesan optimistik, client harus mencari pesan *asli* terakhir sebelumnya sebagai referensi untuk server.
- **Race Condition pada Read State:**
    - **Server:** Hanya memperbarui `lastReadAt` jika timestamp baru lebih besar dari yang sudah ada di database.
    - **Client (IndexedDB):** Mengabaikan update dari Pusher jika timestamp yang diterima lebih lama dari yang tersimpan di cache lokal.

## Panduan Implementasi Fitur Baru
Setiap kali menambahkan fitur yang mengubah state secara instan (misal: Edit Message, Reactions):
1. Selalu gunakan ID korelasi untuk rekonsiliasi.
2. Pastikan payload broadcast menyertakan ID korelasi tersebut.
3. Tangani skenario kegagalan (Rollback) jika server mengembalikan error.
