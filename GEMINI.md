# Project Gemini Instructions

## Primary Mandates
- **Clean Architecture**: Follow the patterns defined in [clean-architecture.md](./clean-architecture.md).
- **Mark as Read**: All changes related to message read status must adhere to the throttled and real-time synchronization strategy documented in [docs/mark-as-read.md](./docs/mark-as-read.md).

## Implementation Rules
1. **Unread Management**:
    - Use `UnreadProvider` for UI state.
    - `RealtimeNotificationListener` is the entry point for Pusher-based unread/read synchronization.
2. **Viewport Performance**:
    - Marking as read via scroll should always be throttled (1.5s delay) to prevent server overload.
    - Refer to `useMarkAsRead.ts` for implementation details.
3. **Multi-device Sync**:
    - Backend must broadcast `room-marked-read` to the user's private channel after a successful update.
