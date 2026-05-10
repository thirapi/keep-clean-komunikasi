# CSS Column-Reverse Architecture

## Deskripsi Singkat
Aplikasi komunkasi ini telah mengadopsi standar *Enterprise Tier* pada kanvas obrolannya (Chat UI) melalui integrasi **CSS `flex-col-reverse`**. Migrasi ini menggantikan *library* *third-party* yang memblokir render secara mutlak dengan teknik penandaan titik dasar secara murni via gaya rentang layar (CSS).

## Masalah *Scroll-Flash*
Secara historis, setiap transisi pembukaan obrolan atau pemasukan *image* baru memerlukan injeksi hitungan tinggi/lebar layar (DOM sizing calculations) melalui JavaScript. Skema ini berujung pada kilatan posisi layar (*scroll flash*) saat pertama kali *hook* seperti `scrollIntoView` dieksekusi. Hal ini tidak dapat mengimbangi kecepatan sinkronisasi RAM-Cache dari IndexedDB yang sangat kilat.

## Mekanika Kerja Cerdas
Dengan melakukan pembaharuan pada berkas `message-list.tsx`:
1. Kontainer dibubuhi utilitas `flex-col-reverse` dan `overflow-y-auto`.
2. Konstruksi pelukisan peramban (DOM) disusun terbalik, meletakkan titik referensi engsel terdalam tepat pada *Pixel-0* / dasar jendela baca. 
3. Titik tersebut (scroll-y `0`) selamanya mengakar di dasar chat.
4. **Natural Anchoring (Tanpa JS)**: Saat barisan teks baru ditembakkan melalui memori cache maupun soket *Pusher*, atau saat memuat rekam jejak gambar (*dynamic image resize*), batas atas dari layout tersebut sekadar menjauh ke teratas langit-langit layar (terekstrusi ke belakang) *TANPA* mengusik/merubah patokan `ScrollTop = 0`. Hal ini menghilangkan mutlak peranan `ResizeObserver` atau komputasi gulir.

## Konvensi yang Harus Dijaga
**DILARANG membalik ulang iterasi di DOM**. 
Setiap barisan *Component* harus disusun ke dalam koleksi kronologis normal lalu dikunci menggunakan perputaran utuh sebelum diproduksi ulang. Hal ini demi merekayasa pelukisan CSS tetapi tetap menetapkan logika hari dan pemisah unread (*Date And Unread Separators*) menyatu solid dan bermakna normal di balik layar.
