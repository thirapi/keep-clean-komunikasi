# Komunikasi

Real-time messaging platform built on **Clean Architecture**, shipped as a web
app and a native Android app from a single codebase.

[![Version](https://img.shields.io/badge/version-1.0.0-A855F7)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-000)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087ea4)](https://react.dev)
[![Tests](https://img.shields.io/badge/tests-59%20passing-22c55e)](https://vitest.dev)

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Native Android app](#native-android-app)
- [Push notifications](#push-notifications)
- [Testing](#testing)
- [Performance tooling](#performance-tooling)
- [Project layout](#project-layout)
- [Database](#database)
- [Documentation](#documentation)
- [Scripts](#scripts)

---

## Features

**Messaging** — channels and direct messages, replies, threads, rich text via a
Lexical editor, attachments, emoji reactions, optimistic UI with server
reconciliation, and offline read via IndexedDB.

**Realtime** — Pusher for new messages, reactions, deletions, typing indicators
and read receipts; WebSocket-backed presence with a Redis index.

**Push** — Web Push (VAPID) for browsers and Firebase Cloud Messaging for the
native app, stored side by side and routed per subscription.

**Accounts** — session auth with rotating tokens, roles and permissions,
impersonation for support, profile editing, custom emoji with shortcodes.

**Platform** — server-rendered App Router, installable PWA, native Android
shell, dark and light themes, Indonesian-first localisation.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui, Phosphor Icons |
| Data | PostgreSQL (Neon) via Drizzle ORM, Upstash Redis |
| Realtime | Pusher, Web Push (VAPID), FCM |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | Session cookies, bcrypt via `@node-rs/bcrypt` |
| Editor | Lexical |
| Tables | TanStack Table |
| State | React Context, Dexie (IndexedDB), Zustand-free by design |
| Mobile | Capacitor 8 (native Android shell) |
| Tests | Vitest, Testing Library, ESLint |

> `bcrypt-ts` is a **devDependency only** — it is kept solely to assert that
> hashes produced by the previous implementation still verify. Runtime hashing
> uses the native binding, which is ~13× less event-loop blocking.

## Quick start

**Requirements:** Node.js 20+, a PostgreSQL database (Neon or local), and a
Pusher app.

```bash
git clone https://github.com/thirapi/keep-clean-komunikasi.git
cd keep-clean-komunikasi
npm install
cp .env.example .env        # then fill it in
npm run db:push             # apply schema
npm run db:seed             # optional: dev users
npm run dev
```

Open <http://localhost:3000>.

`npm run dev:clean` does `db:reset` + `db:push` + `db:seed` + `dev` in one step.

### Environment

Copy `.env.example` and fill in the values. Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PUSHER_*`, `NEXT_PUBLIC_PUSHER_*` | Realtime transport |
| `R2_*` | File uploads |
| `UPSTASH_REDIS_REST_*` | Presence |

Push and media are optional: without `R2_*` uploads fail, without the push keys
the app runs but sends no notifications. See [Push notifications](#push-notifications).

## Architecture

Clean Architecture, enforced by directory layout. Dependencies point inward:

```
src/app/                      Next.js entry — routes, server actions, layouts
        │  (never import inward-facing logic directly)
        ▼
src/lib/interface-adapters/   Controllers — validate input, call a use case
        ▼
src/lib/application/          Use cases — business logic, depend on interfaces
        │
        ├── repositories/      Interfaces (ports)
        └── services/          Interfaces (ports)
        ▼
src/lib/infrastructure/       Implementations — Drizzle, Pusher, R2, Redis
src/lib/entities/             Pure types and DTOs, no logic
```

**Rules**

1. Every frontend call goes `Action → Controller → Use Case → Repository/Service`.
2. Use cases never call other use cases, and never import a concrete adapter.
3. No business logic in controllers, actions, or repositories.
4. All layers are class-based except controllers (functions) and actions.
5. Dependencies are injected through constructors; services with more than one
   implementation get an interface first.

Implementations are wired in the controllers, e.g.
`src/lib/interface-adapters/controllers/users/search.controller.ts`.

## Native Android app

The Android app is a Capacitor shell around the deployed web app.

The WebView loads the **live deployment** rather than a local bundle. A static
export is not possible: the app exposes 53 Server Actions across 12 `"use
server"` modules, and Server Actions only run against a live Next.js server. The
backend is therefore unchanged and every action keeps working.

Native behaviour added: hardware back navigates instead of exiting, the status
bar follows the theme, the body resizes for the keyboard, a native launch
screen, and haptics on message sent/received.

```bash
npm run cap:sync
npm run cap:open:android     # or: npm run cap:run:android
```

Building an APK needs the Android SDK and a JDK; it does not need macOS or
Xcode. See [`docs/native-app.md`](docs/native-app.md).

## Push notifications

Two transports coexist, distinguished by `PushSubscription.type`:

| `type` | Transport | Reaches |
|---|---|---|
| `web` | VAPID (Web Push) | browsers, desktop |
| `fcm` | Firebase Cloud Messaging | native Android app |

> **FCM is delivered by Google Play Services.** Devices without GMS — Huawei in
> particular — can never receive it. That is not a bug we can fix from the
> server side. Web Push remains the transport for those devices, so nobody
> loses notifications.

A token that FCM reports as `UNREGISTERED` or `INVALID_ARGUMENT` is deleted so
the table does not grow and sends stop retrying a dead target. Transient
failures keep the token.

Setup, including the Firebase service account, is in
[`docs/native-app.md`](docs/native-app.md#push-notification-fcm-native--vapid-web).

## Testing

```bash
npm test                 # 59 tests
npm run lint
npx tsc --noEmit
```

Covers use cases with mocked repositories, the password service (including
backwards compatibility of pre-existing hashes), the presence index and its
stale-entry pruning, and push transport routing. The sidebar projection is
additionally verified against a real Postgres by
`npm run verify:sidebar`.

## Performance tooling

Measurement lives in the repo so the numbers in the changelog are reproducible.

```bash
npm run measure:bundle     # initial-load payload per route, from a build
npm run measure:sidebar    # statement count and latency against Postgres
npm run verify:sidebar     # correctness assertions for the sidebar query
npm run measure:markdown   # per-plugin cost of the remark/rehype chain
npm run measure:password   # event-loop blocking per hashing backend
npm run bench:content      # CPU benchmarks
```

`measure:bundle` reads the client-reference manifest, whose `async` flag
distinguishes chunks that load eagerly from those behind a dynamic import — so
it reports what a browser actually pays for, not total static output.

## Project layout

```
src/
├── app/                    Routes, layouts, server actions
├── components/             UI components
│   ├── ui/                 shadcn/ui primitives
│   ├── lexical/            Editor plugins
│   └── native-shell*       Capacitor integration
├── hooks/                  Reusable hooks
├── lib/
│   ├── entities/           Types and DTOs
│   ├── application/        Use cases, ports
│   ├── interface-adapters/ Controllers
│   ├── infrastructure/     Repository and service implementations
│   ├── native/             Native platform helpers
│   └── stores/
└── utils/
docs/                       Feature and design documents
drizzle/                    Schema migrations
scripts/                    Build, measurement and maintenance scripts
```

## Database

Schema is defined in `src/lib/infrastructure/drizzle/schema.ts`; migrations
live in `drizzle/`.

```bash
npm run db:push       # apply the current schema
npm run db:generate   # produce a migration after editing the schema
npm run db:seed       # seed roles, permissions and dev users
npm run db:studio     # open Drizzle Studio
npm run db:reset      # drop and recreate
```

[📊 ERD di dbdiagram.io](https://dbdiagram.io/d/komunikasi-67f935074f7afba184451999)

## Documentation

Feature and design decisions live in `docs/`. These are standards, not
retrospectives — several are cited by the code.

| Document | Covers |
|---|---|
| [mark-as-read](docs/mark-as-read.md) | Throttled read state, multi-device sync |
| [column-reverse-architecture](docs/column-reverse-architecture.md) | CSS-only chat anchoring, no JS scroll math |
| [indexeddb-sync](docs/indexeddb-sync.md) | Local-first message cache |
| [lexical-editor](docs/lexical-editor.md) | Editor architecture and mention nodes |
| [native-app](docs/native-app.md) | Capacitor shell and push setup |
| [optimistic-ui-flow](docs/optimistic-ui-flow.md) | Optimistic updates and reconciliation |
| [custom-emojis](docs/custom-emojis.md) | Shortcodes and R2-hosted emoji |
| [account-filtering](docs/account-filtering.md) | Mute and intensity reduction |
| [fediverse-implementation](docs/fediverse-implementation.md) | ActivityPub protocol |
| [federation-whitelist-strategy](docs/federation-whitelist-strategy.md) | Inbox filtering vs outbound fetch |
| [post-actions](docs/post-actions.md) | Like, repost, quote, bookmark |
| [ui-design-standards](docs/ui-design-standards.md) | Visual conventions |

## Scripts

| Script | Does |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `lint` / `test` | ESLint / Vitest |
| `db:*` | Schema and data |
| `cap:*` | Capacitor native workflow |
| `measure:*` / `verify:*` / `bench:*` | Performance and correctness |

## License

Private. All rights reserved.

---

Made with care by [Thirafi](https://github.com/thirapi).
