# Project Gemini Instructions

## Primary Mandates
- **Clean Architecture**: Follow the patterns defined in [clean-architecture.md](./clean-architecture.md).
- **Post Interactions**: All changes to Like, Repost, Quote, and Bookmark logic MUST follow [docs/post-actions.md](./docs/post-actions.md).
- **Fediverse & ActivityPub**: Refer to [docs/fediverse-implementation.md](./docs/fediverse-implementation.md) untuk standar protokol. Mendukung standar **FEP-e232 (Object Links)** dan **_misskey_quote**.
- **Security Hardening**: Semua request outbound Fediverse wajib melewati proteksi **SSRF** (no private IPs), memiliki limit rekursi thread (max 10), dan menggunakan **Authorized Fetch (Signed GET)**. Concurrent fetches untuk URI yang sama wajib di-lock in-memory.
- **Mark as Read**: All changes related to message read status must adhere to the throttled and real-time synchronization strategy documented in [docs/mark-as-read.md](./docs/mark-as-read.md).
- **Lexical Editor**: All chat input components use the Lexical rich text framework. Refer to [docs/lexical-editor.md](./docs/lexical-editor.md) for architecture decisions.
- **Account Filtering**: Implementasi Mute dan Reduce Intensity WAJIB mengikuti algoritma pembatasan intensitas dan Thread Integrity yang didokumentasikan di [docs/account-filtering.md](./docs/account-filtering.md).
- **Content Integrity**: All components rendering user content (posts, bios, usernames) MUST use `parseFediverseContent` to support custom emojis and maintain visual parity across the Fediverse.
- **Custom Emojis & Reactions**: Implementation of exclusive emoji reactions and R2-hosted custom emojis MUST follow [docs/custom-emojis.md](./docs/custom-emojis.md).
- **Thread Integrity**: Backend logic handling incoming activities MUST implement "Thread Healing" (recursive fetching up to 10 levels) dan melacak URI `context` untuk menjaga keutuhan percakapan.
- **Surgical Content Cleaning**: Parser ActivityPub WAJIB menggunakan regex multiline-safe untuk menghapus penanda fallback "RE: [URL]" yang redundan jika relasi `replyTo` atau `quoteOf` berhasil dibangun.

## Architecture Constraints
1. **Pusher for Microblog (Targeted Only)**: 
    - NEVER use Pusher for public real-time state updates (e.g., live like counts, live feed refresh). 
    - Use Pusher ONLY for private, targeted notifications (e.g., "User X liked your post", "User Y replied to you").
    - Broadcast targeted events to the recipient's private channel (`user-${userId}`).
    - For public state, continue using optimistic UI updates and local cache management.
    - Pusher remains the primary real-time engine for the `chat` / `rooms` domain.

2. **Interaction Integrity**:
    - **No-Null User**: All local interactions (Like, Repost, Bookmark) MUST have a valid `userId`. Backend must reject any action where `userId` is null/undefined.
    - **Single Action (Idempotency)**: Use database transactions and unique constraints to ensure a user can only Like or Repost a specific post once. 
    - **Visual Debugging**: If the UI shows double counts/icons but the database is clean, the bug is strictly in the Frontend state management (Optimistic UI / Cache logic), not the backend.

## Implementation Rules
1. **Unread Management**:
    - Use `UnreadProvider` for UI state.
    - `RealtimeNotificationListener` is the entry point for Pusher-based unread/read synchronization.
2. **Viewport Performance**:
    - Marking as read via scroll is optimized for responsiveness (~600ms delay) to balance server load and user experience.
    - Refer to `useMarkAsRead.ts` for implementation details.
3. **Local-First Caching**:
    - Message fetching is implemented primarily using the **Stale-While-Revalidate** pattern against IndexedDB.
    - Please consult [docs/indexeddb-sync.md](./docs/indexeddb-sync.md) for caching architectures.
4. **Chat Render Architectures**:
    - Avoid Javascript DOM manipulations for anchoring list positions. Leverage column-reverse mechanics.
    - Refer to [docs/column-reverse-architecture.md](./docs/column-reverse-architecture.md) for deep-dive.
5. **Multi-device Sync**:
    - Backend must broadcast `room-marked-read` to the user's private channel after a successful update.
6. **Robust Deletion Strategy**:
    - Message deletions MUST execute `fallbackLastReadMessageId` from `roomRepository` prior to deletion to adjust anchors safely.
7. **Lexical Editor**:
    - Chat input is powered by `MentionTextarea` (Lexical-based). Do NOT use raw `<textarea>` elements.
    - Markdown symbols (`**`, `_`, `~~`, `` ` ``) are **always preserved** in the text — never stripped. Visual decoration is applied via `MarkdownDecoratorPlugin`.
    - Mentions are stored as `<@userId>` tokens in the database and rendered as atomic `MentionNode` instances in the editor.
    - Refer to [docs/lexical-editor.md](./docs/lexical-editor.md) for the full architecture.

## AI Operational & Code Integrity
- **Mandatory Context Review**: AI WAJIB membaca file ini dan dokumentasi relevan di `docs/` sebelum memulai riset atau eksekusi untuk memahami konteks dan batasan proyek.
- **Surgical Modifications**: Utamakan penggunaan tool `replace` daripada `write_file` untuk mengedit file yang sudah ada. Pastikan `old_string` bersifat unik dan konteks yang diambil cukup luas untuk menghindari penimpaan blok kode yang tidak sengaja.
- **Logic Preservation**: JANGAN PERNAH menghapus atau mengubah logika bisnis yang sudah ada kecuali diminta secara eksplisit. Jika perbaikan bug memerlukan perubahan logika, AI harus menjelaskan alasannya dan mempertimbangkan efek sampingnya.
- **Impact Assessment**: Sebelum melakukan perubahan, evaluasi bagaimana perubahan tersebut mempengaruhi flow lain, hook, atau relasi database. Patuhi batasan "Clean Architecture" yang didefinisikan di `clean-architecture.md`.
- **Validation Mandate**: Semua kode yang ditulis harus valid secara sintaksis, *type-safe* (TypeScript), dan diverifikasi melalui skrip pengujian atau unit test sebelum dianggap selesai.
- **Zero Hallucination Policy**: Jika ragu tentang struktur file atau alur logika, gunakan `read_file` atau `grep_search` untuk verifikasi. Dilarang berasumsi tentang keberadaan fungsi, variabel, atau file.
- **User Intent Alignment**: Hanya lakukan perubahan yang benar-benar diminta oleh user atau yang secara teknis diperlukan untuk menyelesaikan masalah yang dilaporkan. Hindari "improvisasi" yang mengubah perilaku dasar aplikasi tanpa persetujuan.

