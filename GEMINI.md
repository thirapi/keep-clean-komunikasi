# Project Gemini Instructions

## Primary Mandates
- **Clean Architecture**: Follow the patterns defined in [clean-architecture.md](./clean-architecture.md).
- **Mark as Read**: All changes related to message read status must adhere to the throttled and real-time synchronization strategy documented in [docs/mark-as-read.md](./docs/mark-as-read.md).

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
