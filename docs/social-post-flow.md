# Social Post Flow & Fediverse Initialization

Dokumen ini menjelaskan arsitektur dan rencana implementasi fitur Social Media (Threads, Replies, Media, Reposts) pada platform Komunikasi, dengan kesiapan untuk integrasi ke Fediverse (ActivityPub) di masa depan.

## 🏛️ Arsitektur

Fitur ini mengikuti standar **Clean Architecture** yang sudah diterapkan di proyek ini:
- **Entities**: Definisi data murni Post dan keterkaitannya.
- **Use Cases**: Logika bisnis untuk interaksi sosial.
- **Repositories**: Penanganan persistensi data Post melalui Drizzle ORM.
- **Controllers & Actions**: Interface untuk menjembatani UI (Next.js Actions) dan logic.

## 📊 Database Schema

Untuk mendukung skalabilitas dan kompatibilitas standar ActivityPub (Fediverse), tabel `Post` dirancang dengan field berikut:

```typescript
export const posts = pgTable("Post", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id),
    content: text("content").notNull(),
    
    // Fediverse Compatibility
    uri: text("uri").unique(),        // Canonical URI (e.g., domain.com/users/thirafi/posts/123)
    url: text("url"),                 // Public web URL
    
    // Interactions
    replyToId: text("replyToId"),     // Internal reference for Threads
    repostOfId: text("repostOfId"),   // Internal reference for Reposts
    
    visibility: text("visibility").default("public").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const followers = pgTable("Follower", {
    id: text("id").primaryKey(),
    followerId: text("followerId").notNull().references(() => users.id),
    followingId: text("followingId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

## 🚀 Fitur Utama

### 1. Threads (Main Posts)
Input menggunakan `MentionTextarea` (Lexical Framework). Konten disimpan dalam format Markdown asli untuk menjaga interoperabilitas data.

### 2. Replies
Setiap balasan disimpan sebagai entitas `Post` baru dengan `replyToId` yang merujuk pada parent-nya. Ini memungkinkan struktur diskusi yang dalam (recursive).

### 3. Media
Menggunakan integrasi dengan tabel `Attachment`. Setiap Post dapat memiliki satu atau lebih attachment (Gambar/Video) yang disimpan di S3.

### 4. Reposts
Repost disimpan sebagai `Post` baru yang memiliki referensi `repostOfId`. Secara visual di UI, ini akan merender konten dari post original.

## 🌐 Kesiapan Fediverse (Verdiverse)

Fitur ini dirancang "Ready" untuk Fediverse melalui:
1. **URI-based Identity**: Setiap post memiliki URI unik yang bisa di-crawl oleh instance lain (Mastodon, dll).
2. **Actor compatibility**: Schema user disiapkan untuk menampung RSA Keys (Public/Private) untuk signing aktivitas.
3. **ActivityStreams Mapping**:
   - Create Post -> `Create` Activity
   - Repost -> `Announce` Activity
   - Reply -> `Note` with `inReplyTo` field

## 🛠️ Roadmap Pengembangan

1. **Phase 1: Foundation**
   - Implementasi schema Drizzle.
   - Pembuatan Entity model dan Repository interface.
   - Pendaftaran repository di Dependency Injection (ID).

2. **Phase 2: Use Cases & Actions**
   - Implementasi `CreatePostUseCase`.
   - Implementasi `GetProfileFeedUseCase`.
   - Export Server Actions untuk konsumsi frontend.

3. **Phase 3: UI Integration**
   - Update `ProfileView` untuk menampilkan feed dinamis.
   - Penambahan input modal menggunakan Lexical Editor.
   - Implementasi komponen `PostItem` dengan dukungan Media & Repost view.

4. **Phase 4: Social Interactions & Timeline**
   - [x] Implementasi Repost logic & Undo.
   - [x] Implementasi Reply nesting & Modal.
   - [x] Global Timeline feed.
   - [x] **Strict Interaction Integrity**: No Pusher for microblog interactions (Like, Repost, Bookmark). Uses local cache sync exclusively.

5. **Phase 5: Unified Discovery & Following**
   - [x] Implementasi sistem Follow/Following (Clean Architecture & Fediverse-ready).
   - [x] Mengikuti Feed (Timeline khusus orang yang diikuti).
   - [x] Discovery View (Global discovery dengan layout premium).
   - [x] Knowledge Bridge: Integrasi tombol "Promote to Pulse" di Chat UI.
   - [x] Sidebar Redesign: Penggunaan resizable panels untuk FEED, Channels, dan DMs.
   - [x] **Unified Hub**: Post detail (`/posts/[id]`) dipindahkan ke `(with-sidebar)` route group.
   - [x] **Public Access (Guest Mode)**: Layout mendukung akses tanpa login — sidebar menampilkan tombol "Masuk" dan menyembunyikan Channels/DMs untuk pengunjung.
   - [x] **Mobile Support**: Semua halaman Feed (Timeline, Discovery, Following, Thread) memiliki tombol kembali yang konsisten di mobile.
   - [x] **Import Refactoring**: Semua path import menggunakan alias `@/` untuk stabilitas.

6. **Phase 6: Fediverse Advanced**
   - [x] Quote Posts (Repost with commentary) — *Strictly separated from Reposts*.
   - [x] ActivityPub Outbox/Inbox basic logic.
   - [x] HTTP Signatures for cross-instance auth.
   - [x] HTML & Fediverse Rendering (rehype-raw).
   - [x] Accurate Profile Stats (Mastodon Extensions).

## 📄 Source of Truth
Untuk detail teknis terbaru mengenai interaksi dan integritas data, selalu rujuk pada:
*   [docs/post-actions.md](./post-actions.md) - Standar interaksi Like/Repost/Quote.
*   [docs/fediverse-implementation.md](./fediverse-implementation.md) - Status & teknis ActivityPub.

## 🏗️ Routing Architecture

```
src/app/
├── (with-sidebar)/          # Unified Hub (sidebar + content)
│   ├── layout.tsx           # Session-optional layout (supports guest)
│   ├── channels/[roomId]/   # Chat rooms
│   ├── timeline/            # Global timeline
│   ├── discovery/           # Public discovery feed
│   ├── following/           # Following-only feed
│   └── posts/[postId]/      # Thread detail (public accessible)
├── profile/[username]/      # User profiles (standalone)
├── posts.action.ts          # Post server actions
└── auth.action.ts           # Auth server actions
```

## 🎨 UI/UX Standards
- **Width**: Feed Timeline harus dibatasi (`max-w-2xl`) dan berada di tengah untuk kenyamanan membaca.
- **Consistency**: Navigasi utama (Feed, Channels, DMs) harus menggunakan sistem resizable panels (drag-to-size).
- **Themes**: Link pada post menggunakan warna aksen (primary/purple) yang konsisten dengan tema Slack-style.
- **Mobile Navigation**: Tombol kembali menggunakan `ChevronLeft` bulat (`rounded-full`, `bg-accent/50`, `border-2 border-accent`) yang konsisten di semua halaman.
- **Guest Mode**: Sidebar menampilkan tombol "Masuk ke Komunikasi" sebagai pengganti NavUser saat belum login.

---
*Created: May 2026*
