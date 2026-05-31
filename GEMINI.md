# Project Gemini Instructions

## Primary Mandates
- **Clean Architecture**: Follow the patterns defined in [clean-architecture.md](./clean-architecture.md).
- **Post Interactions**: All changes to Like, Repost, Quote, and Bookmark logic MUST follow [docs/post-actions.md](./docs/post-actions.md).
- **Fediverse & ActivityPub**: Refer to [docs/fediverse-implementation.md](./docs/fediverse-implementation.md) for protocol standards and status.
- **Mark as Read**: All changes related to message read status must adhere to the throttled and real-time synchronization strategy documented in [docs/mark-as-read.md](./docs/mark-as-read.md).
- **Lexical Editor**: All chat input components use the Lexical rich text framework. Refer to [docs/lexical-editor.md](./docs/lexical-editor.md) for architecture decisions.

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

