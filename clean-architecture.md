--- 
description: This Rule is helpfull to knowing the project structure flow reggardign Clean Architecture
alwaysApply: false
---

Project ini menggunakan pendekatan Clean Architecture dengan pembagian layer sebagai berikut:

Entities

Berisi definisi type atau class object.

Hanya menyimpan struktur data pure tanpa logika

Contoh: [category.model.ts](mdc:src/lib/entities/models/category.model.ts), [user.model.ts](mdc:src/lib/entities/models/user.model.ts), [response.model.ts](mdc:src/lib/entities/models/response.model.ts).

Repository
Bertanggung jawab untuk interaksi dengan database.
Implementasi dari abstraksi repository (misal: [user.repository.ts](mdc:src/lib/infrastructure/repositories/user.repository.ts)).
Tidak boleh memiliki logika bisnis.

Service
Digunakan untuk proses-proses terpisah yang bukan bagian dari core business logic, tapi tetap penting (e.g., enkripsi password, mengirim email).
Service hanya dipanggil dari Use Case, bukan dari Controller atau Action. contohnya [authentication.service.ts](mdc:src/lib/infrastructure/services/authentication/authentication.service.ts) [password.service.ts](mdc:src/lib/infrastructure/services/authentication/password.service.ts)

Use Case
Layer ini mengatur business logic dan application logic.
Berinteraksi dengan Repository dan Service via Dependency Injection.
Tidak boleh:
Memanggil Use Case lain.
Bergantung pada implementasi konkret repository/service.
Wajib menggunakan paradigma Object Oriented (Class-based). Contohnya [delete-category.use-case.ts](mdc:src/lib/application/use-cases/category-management/delete-category.use-case.ts) [invite-user.use-case.ts](mdc:src/lib/application/use-cases/user-management/invite-user.use-case.ts) [get-user-by-id.use-case.ts](mdc:src/lib/application/use-cases/user-management/get-user-by-id.use-case.ts)

Controller

Bertanggung jawab untuk:
Validasi input menggunakan schema (misalnya Zod/Yup).
Memanggil Use Case yang relevan.
Menangani error handling dan konversi response.
Tidak boleh memanggil repository atau service langsung. Khusus untuk controller menggunakan fungsi, bukan class based.
Contohnya [sign-in.controller.ts](mdc:src/lib/interface-adapters/controllers/auth/sign-in.controller.ts) [get-plan.controller.ts](mdc:src/lib/interface-adapters/controllers/plan/get-plan.controller.ts) [add-product.controller.ts](mdc:src/lib/interface-adapters/controllers/product-management/add-product.controller.ts) [get-invitation.controller.ts](mdc:src/lib/interface-adapters/controllers/user-management/get-invitation.controller.ts)

Action

Merupakan server action (Next.js App Router).
Entrypoint dari frontend.
Bertugas memanggil Controller.
Tidak boleh mengandung logika bisnis atau validasi.
contoh [auth.action.ts](mdc:src/app/auth.action.ts) [plan.action.ts](mdc:src/app/pricing/plan.action.ts)

🔒 Aturan Strict:

- Semua komunikasi frontend ➝ backend harus melalui Action ➝ Controller ➝ Use Case.
- Use Case tidak boleh memanggil Use Case lain.
- Tidak ada logic bisnis di Controller, Action, atau Repository.
- Semua layer wajib berbasis Class, kecuali Controller (boleh fungsi) dan Action.
- Semua Dependency Injection dilakukan via constructor pada Class-based layers. Untuk Controller berbasis fungsi, dependency harus diinisialisasi di level file atau dipassing secara eksplisit jika diperlukan untuk testing.
- **Optimistic UI:** Setiap mutasi yang memerlukan feedback instan wajib menggunakan `correlationId` (seperti `optimisticId`) untuk rekonsiliasi state di frontend. Lihat [optimistic-ui-flow.md](mdc:docs/optimistic-ui-flow.md).
- **Idempotency:** Action dan Controller harus menangani potensi pengiriman ganda. Gunakan validasi timestamp atau ID unik untuk mencegah data basi menimpa data baru.
- Apabila service dan repository memiliki kemungkinan untuk memndapatkan beberapa implementasi, maka buat interface nya dulu contohnya adalah [email.service.interface.ts](mdc:src/lib/application/services/email.service.interface.ts) dan implementasi nya adalah [resend-email.service.ts](mdc:src/lib/infrastructure/services/email/resend-email.service.ts) sehingga nanti jika saya butuh implementasi dengan email service lain tinggal menggunakan interface nya saja.
- Use case dan controller bersifat spesifik, sedangkan action bersifat grup, contohnya action [auth.action.ts](mdc:src/app/auth.action.ts) yang dapat berisi [sign-in.controller.ts](mdc:src/lib/interface-adapters/controllers/auth/sign-in.controller.ts) dan controller lain yang berkaitan dengan auth

Flow untuk melakukan implementasi sebuah action, sebagai contoh action untuk mendapatkan Data product client:

1. Cek pada model database terlebih dahuu mengenai struktur nya
2. Cek pada Entites model sudah ada atau belum tipe untuk data tersebut, jika belum maka buat
3. Cek pada repository yang berkaitan, dalam hal ini adalah [product.repository.ts](mdc:src/lib/infrastructure/repositories/product.repository.ts) sudah ada method yang sesuai atau belum, jika belum maka tambahkan.
4. Cek apakah ada service yang diperlukan, jika tidak maka lanjutkan, dan jika ada maka buat service nya sesuai dengan kebutuhan.
5. Buat sebuah use case secara spesifik untuk mendaptakan data product client, passing depedency melalui constructor seperti [get-all-products.use-case.ts](mdc:src/lib/application/use-cases/product-management/get-all-products.use-case.ts)
6. Buat controller untuk use case tersebut contohnya [get-all-products.controller.ts](mdc:src/lib/interface-adapters/controllers/product-management/get-all-products.controller.ts)

7. Tambahkan fungsi di file action mengenai product untuk memanggil controller