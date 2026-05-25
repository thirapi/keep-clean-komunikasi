# Optimistic UI Persistence Strategy

## Overview
Untuk menangani masalah hilangnya status post optimistik saat navigasi, aplikasi menggunakan layer persistensi berbasis IndexedDB (via `idb-keyval`). Pendekatan ini menjaga post tetap ada di browser storage hingga sinkronisasi server berhasil/gagal.

## Architecture (Clean Architecture Alignment)
- **Infrastructure Layer**: Repository `optimisticPostRepository` bertanggung jawab atas interaksi dengan IndexedDB (`src/lib/infrastructure/optimistic-post.repository.ts`).
- **Data Encapsulation**: Menyimpan `PostWithUserDTO` langsung ke storage untuk menjaga konsistensi tipe data dengan layer entity.
- **Client-Driven ID**: Menggunakan CUID yang di-generate di browser sebagai primary key permanen untuk sinkronisasi tanpa flicker.

## Workflow
1. **Client Identity**: Post dibuat dengan ID permanen (CUID) di sisi client menggunakan `@paralleldrive/cuid2`.
2. **Local Persistence**: `optimisticPostRepository.savePendingPost` menyimpan data ke IndexedDB agar post tetap muncul meskipun user melakukan navigasi atau refresh sebelum server merespon.
3. **Seamless Handover**: Client mengirim ID tersebut ke server. Server **wajib** menggunakan ID ini saat menyimpan ke database.
4. **Reconciliation**: Hook `useFeedWithOptimistic` melakukan deduplikasi otomatis. Jika ID dari server muncul, data "pending" lokal akan dilepas demi data server yang berwibawa.
5. **Completion**: Setelah sukses, record dibersihkan dari IndexedDB untuk menjaga kebersihan storage.

## Safety
- **Anti-Flicker**: Karena ID client dan server identik, tidak ada momen "postingan menghilang" saat transisi data.
- **Resilience**: Postingan yang belum sinkron tetap tersimpan di storage lokal hingga 10 menit (autosync/cleanup).
- **Twitter-style Stability**: Posisi feed tetap stabil, tidak terganggu oleh update real-time yang agresif kecuali atas permintaan user (refetch).
