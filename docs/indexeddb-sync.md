# Dokumentasi IndexedDB Offline Sync & Local-First Architecture

## Overview
Aplikasi ini menerapkan pendekatan **Local-First Architecture** menggunakan **IndexedDB (Dexie.js)** untuk menyuguhkan perpindahan antar-ruangan (room switching) tanpa *delay/loading state*, sekaligus mereduksi beban *polling/fetch* ke database utama.

## Flow Implementasi (Stale-While-Revalidate)

### 1. Zero-Latency Hydration (Offline Ready)
Saat pengguna membuka `/channels/[roomId]`, komponen `ChatRoomClientWrapper` tidak langsung berinteraksi dengan server.
- **Langkah 1**: Aplikasi menarik data state awal (Room Metadata & 50 pesan terakhir) dari IndexedDB lokal yang tersimpan via `clientChatCache.getMessages()`.
- **Langkah 2**: UI langsung terbangun (paint UI) menggunakan data kuki lokal sehingga user seketika melihat history obrolan lama (0 latency).

### 2. Background Sync
Sesaat setelah UI lokal ter-hidrasi, *Network Request* asinkron dijulurkan:
- Mengambil parameter mutakhir seperti `getRoom()`, `getMessage(50)`, dan status `lastReadAt`.
- Jika data kembalian server berhasil ditarik, UI akan disegerakan pembaruannya (State Overwrite) menambal pesan yang tak tersinkron, kemudian metadata di IndexedDB akan tertindih (`bulkPut`) menjadi versi ter- *up-to-date*.

### 3. Pusher & Reactive Cache (Live Append)
Komponen `chat-room.tsx` mendengarkan event *real-time* dari Pusher (`chat-{roomId}`).
- **Incoming Messages**: Di *append* ke state memori `messages` dan serta-merta ditembakkan masuk ke IndexedDB `db.messages.bulkPut([msg])` melalui pemanggilan `clientChatCache.mergeMessages()`.
- **Deletion**: Saat menangkap event penghapusan (`message-deleted`), pesan tak sekadar dihilangkan dari state React, tapi juga otomatis ditarik bersih dari lokal (`clientChatCache.removeMessage()`).

## Arsitektur Data Lokal (`ClientChatCache`)
Data model lokal dibentuk memakai **Dexie** di atas IndexedDB dengan namespace `KomunikasiClientDB`:
- `messages` (Table): Menyimpan array `MessageWithUserDTO`. Dimanajemen menggunakan policy limit **50 pesan** per roomId agar konsumsi stroge peramban *(browser)* tidak membengkak tanpa merusak pengalaman awal pengguna.
- `roomMetadata` (Table): Melacak indikator pembacaan seperti `lastReadId` dan `lastReadAt` tanpa blokade I/O sseperti LocalStorage murni.
- **In-Memory RAM Map**: Menambahkan map sinkronus (`memMessages`, `memRooms`) bekerja paralel dengan IndexedDB untuk meredam *1-tick delay skeleton blink* saat pengguna berpindah tab/ruangan maju-mundur di sesi yang sama.

## Mekanisme Auto-Scroll Cerdas (Zero-Latency Adapter)
Pemanggilan komponen yang serba seketika (tanpa *delay network*) menuntut manipulasi susunan DOM tingkat tinggi pada Hook Scrolling.
- Perintah *Scroll* menuju pesan "Unread" atau ke batas terbawah digeser dari metode konvensional `setTimeout` menjadi rantai `requestAnimationFrame` (`use-scroll-to-initial.ts`).
- Modifikasi ini menyelaraskan putaran kalkulasi DOM dengan siklus *Browser Paint*, memastikan tinggi setiap partikel pesan telah selesai ter- *render* sebelum layar digulir.


## Guardrails Pengembangan
1. **Dilarang Mutasi Sinkronus**: Seluruh metode dalam obyek ekspor `clientChatCache` bersifat *Asynchronous* (`Promise`) guna menghindari *main thread blocking*.
2. **Limitasi Cache**: Saat membuat logika penyisipan massal (*bulk/inserting*), metode `mergeMessages()` harus selaras mengecek *count* dan mengekskusi `bulkDelete` bila indeks melampaui proteksi batas lokal (~50 pesan). Batasan ekstrim ini melindungi performa perangkat kelas rendah.
