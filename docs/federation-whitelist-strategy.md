# Federation Architecture: Dynamic Whitelist Strategy

Dokumen ini menjelaskan keputusan arsitektural mengenai cara platform Komunikasi menangani federasi ActivityPub, khususnya keseimbangan antara keamanan (inbound) dan penemuan (outbound).

## Filosofi Desain

Sistem ini mengadopsi prinsip **"Safe Discovery, Guarded Delivery"**. Kami tidak menutup diri dari Fediverse, namun kami membatasi konsumsi resource dan tampilan konten hanya dari sumber yang relevan bagi pengguna kami.

### 1. Inbound: Benteng Pertahanan (Inbox Filtering)

Pintu masuk utama untuk data dari luar adalah endpoint `inbox`. Di sini, sistem menerapkan **Dynamic Whitelist**:

- **Kriteria Whitelist**: Sebuah domain dianggap terpercaya jika ada minimal satu pengguna lokal yang mengikuti (**follow**) akun dari domain tersebut.
- **Penyaringan Konten**: Aktivitas tipe `Create` (postingan baru) dan `Announce` (repost) hanya diproses jika berasal dari domain terpercaya.
- **Interaksi Dasar**: Aktivitas `Follow`, `Like`, dan `Undo` selalu diizinkan dari mana saja. Hal ini memastikan user dari instance baru tetap bisa mulai berinteraksi dengan kita.

**Alasan Arsitektural:** Ini mencegah spam massal dari instance asing masuk ke database dan timeline kita tanpa memutus kemampuan user baru untuk bergabung.

### 2. Outbound: Jembatan Penemuan (Open Fetching)

Sistem **TIDAK** membatasi pengambilan data keluar (**outbound fetch**):

- **Discovery**: Server diizinkan melakukan `GET` (signed fetch) ke domain mana pun di Fediverse.
- **Pencarian User**: Saat pengguna lokal mencari handle luar (misal: `@user@instance-asing.com`), server wajib melakukan fetch profil tersebut agar informasi tersedia dan tombol "Follow" bisa muncul.
- **Keamanan**: Karena inisiatif berasal dari server kita sendiri (pull), bukan paksaan dari luar (push), jalur ini aman dari serangan spam massal.

**Alasan Arsitektural:** Membatasi fetch keluar akan menciptakan isolasi permanen di mana pengguna kita tidak akan pernah bisa menemukan atau mem-follow orang dari instance yang belum kita kenal.

### 3. Penanganan Konteks (Thread Healing)

Selama proses *Thread Healing*, sistem mungkin menarik postingan dari domain yang tidak kita follow untuk melengkapi utas percakapan:

- **Penyimpanan Lokal**: Postingan ini disimpan di database agar percakapan tetap utuh secara visual.
- **Status Whitelist**: Proses ini **tidak** memberikan status "terpercaya" kepada domain tersebut. Domain tersebut tetap tidak bisa mengirimkan (push) postingan baru ke inbox kita di masa depan selama belum ada relasi follow yang sah.

### 4. Integritas Timeline

Timeline "Federasi" menampilkan konten yang sudah berhasil masuk ke database melalui filter Inbox yang ketat. Oleh karena itu:
- Tidak diperlukan filter SQL tambahan yang mengecek status follow pada setiap baris data.
- Database dianggap sudah "bersih secara desain" melalui pintu gerbang Inbox.
- Hal ini menjaga performa kueri tetap cepat dan memastikan konteks percakapan tetap utuh.

---
*Keputusan Arsitektur - Juni 2026*
