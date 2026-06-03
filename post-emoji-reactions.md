# Plan: Post Emoji Reactions (Misskey-style)

## Background & Motivation
The goal is to implement emoji reactions for microblog posts, similar to Misskey, while maintaining compatibility with the Fediverse. We already have a foundation in the chat (reactions) and basic post interaction logic (Likes).

## Current State
- **Database**: `postReaction` table exists with fields: `id`, `postId`, `userId`, `remoteActorId`, `emoji`.
- **UI Components**: `EmojiPickerComponent` exists in `channels/[roomId]/components/`.
- **Repository**: `PostRepository` has `addReaction` and `removeReaction`.
- **Fediverse**: `ActivityPubService` handles `Like` but not custom `EmojiReact`.

## Proposed Solution

### 1. Backend Extensions
- **ActivityPub Service**:
    - Implement `sendEmojiReactionActivity`: Sends an `EmojiReact` activity (Misskey format) to remote actors.
    - Implement `sendUndoEmojiReactionActivity`: Sends an `Undo` for a previous `EmojiReact`.
- **Inbox Handling**:
    - Update `inbox/route.ts` to handle incoming `EmojiReact` and `Undo EmojiReact` (mapping them to `postReaction` table).
- **Use Case**:
    - Create/Update `InteractWithPostUseCase.toggleReaction` to handle adding/removing any emoji (not just "❤️").
    - Ensure notifications are triggered for reactions other than likes.

### 2. Frontend Integration
- **Generic Emoji Picker**:
    - Move `EmojiPickerComponent` to a more shared location (e.g., `src/components/emoji-picker.tsx`).
- **Post Item Component**:
    - Update `PostItem` to display a list of reactions with counts and "has reacted" status.
    - Add a "Add Reaction" button in the post actions bar.
- **Optimistic UI**:
    - Implement optimistic updates for reactions in `use-feed-with-optimistic.ts` or directly in the post item state.

### 3. Data Flow
1. User clicks emoji in picker.
2. UI updates optimistically (counter increases, icon glows).
3. `toggleReactionAction` is called.
4. Backend:
    - Checks if reaction exists.
    - Adds/Removes from `postReaction` table.
    - If remote post, sends `EmojiReact`/`Undo` activity.
    - If local post, sends Pusher notification to author.

## Verification Plan
- **Unit Tests**: Test `PostRepository` reaction methods.
- **Integration Tests**: Verify ActivityPub mapping for `EmojiReact`.
- **Manual Testing**:
    - React with Unicode emoji.
    - React with multiple emojis.
    - Undo reaction.
    - Verify counter updates correctly.
    - Verify notifications appear for the author.
