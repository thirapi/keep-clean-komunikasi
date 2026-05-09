# Dokumentasi Mark as Read (Robust & Throttled)

## Overview
Fitur "Mark as Read" dalam aplikasi ini diimplementasikan dengan mengikuti best practice dari platform besar seperti Slack dan Discord. Fokus utamanya adalah efisiensi (throttling), real-time update di sidebar, dan sinkronisasi antar perangkat (multi-device sync).

## Flow Implementasi

### 1. Real-time Unread Notification (Sidebar)
Ketika pesan baru tiba, sistem akan memberitahu semua peserta ruangan melalui Pusher (`new-message-notification`).
- **Frontend (`RealtimeNotificationListener.tsx`)**: Komponen ini mendengarkan notifikasi tersebut. Jika user sedang tidak membuka ruangan (room) yang dimaksud, sistem akan memanggil `markAsUnread(roomId)` pada `UnreadProvider`.
- **UI Feedback**: Sidebar akan langsung menampilkan indikator "pulse" merah pada ruangan tersebut tanpa perlu refresh halaman.

### 2. Throttled Viewport Marking (Slack-style)
Untuk menghindari update server yang berlebihan dan memastikan akurasi "pesan benar-benar dibaca", sistem menggunakan pendekatan throttled.
- **Hook (`useMarkAsRead.ts`)**: Menggunakan `IntersectionObserver` untuk melacak pesan yang masuk ke viewport.
- **Delay (1.5 Detik)**: Pesan baru ditandai sebagai "dibaca" hanya jika pesan tersebut menetap di viewport selama minimal 1.5 detik. Jika user melakukan scroll cepat melewati pesan tersebut, timer akan dibatalkan (cancel).
- **Auto-Mark All**: Jika user melakukan scroll hingga mencapai bagian paling bawah chat, seluruh pesan di ruangan tersebut akan langsung ditandai sebagai dibaca.

### 3. Sinkronisasi Antar Perangkat (Multi-device Sync)
Status "sudah dibaca" disinkronkan di semua tab atau perangkat user yang sedang aktif.
- **Backend (`UpdateLastReadAtUseCase.ts`)**: Setelah database berhasil diupdate, server akan mengirim event `room-marked-read` ke channel pribadi user (`user-{userId}`).
- **Frontend**: `RealtimeNotificationListener.tsx` mendengarkan event ini dan memanggil `markAsRead(roomId)` pada `UnreadProvider` lokal, sehingga indikator unread di sidebar hilang secara otomatis di tab lain.

### 4. Sidebar Unread Logic & UI Alignment
Untuk menjaga konsistensi antara tampilan chat dan sidebar:
- **Sender Awareness Rule**: Indikator unread (baik separator maupun sidebar dot) hanya muncul jika ada pesan baru dari **orang lain**. Pesan yang dikirim oleh diri sendiri tidak akan pernah memicu status unread.
- **Logic Alignment**: Sidebar menggunakan `lastReadAt` (timestamp) sebagai sumber kebenaran utama untuk dibandingkan dengan `createdAt` pesan terbaru.
- **UI Positioning**: 
    - **Position**: Indikator unread (dot merah) diletakkan di pojok kanan atas avatar (`-top-0.5 -right-0.5`).
    - **Consistency**: Posisi ini seragam baik dalam mode expanded maupun collapsed.
    - **Visual**: Animasi pulse dihilangkan untuk tampilan yang lebih bersih.

## Aturan Pengembangan (Guardrails)
1. **Prioritas Kebenaran**: Selalu gunakan `lastReadAt` (timestamp) sebagai *Primary Source of Truth*. `lastReadAt` kini menyimpan **waktu pembuatan pesan** (`createdAt`) terakhir yang dibaca, bukan waktu aksi "mark as read". `lastReadMessageId` berfungsi sebagai anchor sekunder.
2. **Sender Awareness**: Filter ketat `userId !== currentUserId` wajib diterapkan di semua logika penentuan status unread agar pesan sendiri tidak memicu indikator.
3. **Clean Architecture**: Logika broadcast dan penentuan unread harus tetap berada di layer Use Case.

## Handling Message Deletions (Robust Deletion Strategy)
Untuk menjaga konsistensi posisi separator unread saat ada pesan yang dihapus:
1. **Neighbor Anchor**: Jika pesan yang menjadi `lastReadMessageId` dihapus, sistem akan mencoba mencari pesan **tepat sebelum** pesan yang dihapus tersebut sebagai anchor baru. Ini menjaga posisi "sudah dibaca" tetap stabil.
2. **Timestamp Fallback**: Jika anchor baru tidak ditemukan, sistem jatuh (fallback) ke penggunaan `lastReadAt`. Karena `lastReadAt` menyimpan waktu pembuatan pesan terakhir yang valid, posisi unread akan tetap akurat.
3. **Self-Correction**: Jika setelah penghapusan pesan, semua pesan yang tersisa adalah milik user sendiri, indikator unread akan otomatis hilang.

---
*Dokumen ini merupakan bagian dari standar engineering proyek. Referensi Arsitektur: [clean-architecture.md](../clean-architecture.md)*
