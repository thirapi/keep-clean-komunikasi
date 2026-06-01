# Post Item Navigation & Event Handling

Dokumen ini menjelaskan arsitektur navigasi dan penanganan event pada komponen `PostItem` untuk memastikan pengalaman pengguna yang konsisten dan dukungan terhadap fitur `nextjs-toploader`.

## Masalah: Next.js TopLoader & `router.push`

Secara default, `nextjs-toploader` (dan library serupa seperti `nprogress`) memantau event klik pada elemen anchor (`<a>`) untuk menampilkan bar progres loading. Ketika navigasi dilakukan secara programatik menggunakan `router.push()` dari Next.js, library ini **tidak** secara otomatis mendeteksi perpindahan rute tersebut.

Hal ini menyebabkan UI terasa "statis" atau "hang" saat berpindah ke detail postingan yang berat, karena tidak ada indikator visual bahwa proses loading sedang berjalan.

## Solusi: Hidden Link Trick

Untuk mengatasi hal di atas sambil tetap menjaga fitur **Text Selection** (agar user tetap bisa menyalin teks postingan tanpa memicu navigasi), kita menggunakan strategi "Hidden Link":

1.  **Elemen Anchor Tersembunyi:** Kita meletakkan sebuah elemen `<Link>` dari Next.js di dalam kontainer `PostItem` dan menyembunyikannya dengan class `hidden`.
2.  **Trigger Programatik:** Pada fungsi `handleContainerClick`, kita pertama-tama memeriksa apakah user sedang menyeleksi teks. Jika tidak, kita mencari elemen link tersebut menggunakan DOM selector dan memicu fungsi `.click()`-nya.

```tsx
const handleContainerClick = (e: React.MouseEvent) => {
    // 1. Cek seleksi teks
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    
    // 2. Cari link tersembunyi dan klik secara nyata (bukan router.push)
    const link = (e.currentTarget as HTMLElement).querySelector(".post-item-link") as HTMLAnchorElement;
    if (link) {
        link.click(); // Ini akan mentrigger nextjs-toploader
    }
};
```

## Penanganan Event Bubbling (Klik Tembus)

Komponen `PostItem` bersifat interaktif di banyak tempat (Avatar, Action Buttons, Dropdown, Media). Kita harus memastikan klik pada elemen-elemen ini tidak "menembus" ke kontainer utama dan mentrigger navigasi ke detail.

### Prinsip Utama: `e.stopPropagation()`

Setiap elemen interaktif **WAJIB** memanggil `e.stopPropagation()` pada event `onClick`-nya.

1.  **Aksi Langsung:** Tombol Like, Repost, Bookmark dsb.
2.  **Dropdown Menus:** Karena Dropdown (Radix UI) menggunakan **React Portals**, event klik di dalam menu akan "melompat" kembali ke tree komponen asalnya. Oleh karena itu, `DropdownMenuContent` harus dibungkus dengan handler yang menghentikan propagasi.
3.  **Modal & Dialog:** Sama seperti dropdown, modal balasan dan kutipan juga menggunakan Portals. Semua modal harus dibungkus dalam kontainer yang menghentikan propagasi event agar interaksi di dalam modal tidak membuka detail postingan di belakangnya.
4.  **Media & Lightbox:** Klik pada gambar/video untuk membuka lightbox harus diisolasi. Begitu pula saat lightbox terbuka, klik navigasi di dalamnya jangan sampai bocor ke `PostItem`.

### Batasan Arsitektur

*   **Penting:** Jangan pernah menghapus `onClick={(e) => e.stopPropagation()}` dari kontainer aksi atau media kecuali Anda berniat mengubah perilaku dasar navigasi seluruh aplikasi.
*   **Quote Preview:** Untuk `QuotePreview`, kita menggunakan komponen `<Link>` secara langsung sebagai kontainer utama karena komponen ini tidak memerlukan logika pemilihan teks yang kompleks seperti post utama.

## Checklist saat Modifikasi `PostItem`

- [ ] Apakah elemen baru yang Anda tambahkan bersifat interaktif?
- [ ] Jika ya, apakah sudah ditambahkan `e.stopPropagation()`?
- [ ] Jika menggunakan Portal (Modal/Popver), apakah kontainernya sudah mengamankan event bubbling?
- [ ] Pastikan tidak merusak class `.post-item-link` karena itu adalah kunci trigger loading bar.
