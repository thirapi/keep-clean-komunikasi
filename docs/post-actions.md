# Post Interaction Flow & Data Integrity

This document defines the strict architectural standards for post interactions (Like, Repost, Quote, Bookmark) to ensure consistency across the codebase.

## 1. Interaction Definitions

### Pure Repost
*   **Definition**: A post that purely shares another post without adding new content.
*   **Data Criteria**: `repostOfId` is present AND `content` is empty (`""`) AND `attachments` is empty.
*   **Behavior**:
    *   Toggleable: Clicking "Repost" again removes it (Undo Repost).
    *   Unique: A user can only have **one** active Pure Repost for a specific post.
    *   Impact: Increases `repostCount`.
    *   UI: Makes the Repost button **active** (Emerald color).

### Quote Post
*   **Definition**: A post that shares another post but adds its own commentary or media.
*   **Data Criteria**: `repostOfId` is present AND (`content` is NOT empty OR `attachments` is NOT empty).
*   **Behavior**:
    *   Additive: Can be performed multiple times by the same user.
    *   Independent: Does NOT trigger "Undo Repost".
    *   Impact: Does NOT increase `repostCount` (handled as a separate post or "Quote" metric).
    *   UI: Does NOT make the Repost button active.

### Like & Bookmark
*   **Behavior**: Strictly toggleable and unique per user/post.
*   **Impact**: Increases `reactionCount` (for likes) or `isBookmarked` state.

## 2. Backend Implementation Standards (Clean Architecture)

### Repository Layer
*   `repostCount` MUST only count Pure Reposts (`content: ""`).
*   `isRepostedByCurrentUser` MUST only check for Pure Reposts.
*   All count queries MUST ignore deleted posts (`isDeleted: false`).

### Use Case Layer
*   `toggleLike` and `repost` actions MUST be wrapped in **Database Transactions**.
*   Validation: Reject any interaction if `userId` is missing.
*   Return Value: Always return the **Updated Original Post** with latest statistics.

## 3. Frontend Implementation Standards (State Management)

### Optimistic UI
*   Every interaction MUST update the local cache immediately (`onMutate`) for a "Premium" feel.
*   Consistency: Use `updatePostInCache` to sync the state across all views (Timeline, Profile, Detail).

### Component Responsibility
*   **PostItem**: Handles the orchestration of state and logic.
*   **PostActions**: Purely presentational; receives `active` and `count` props.
*   **PostStats**: Purely presentational; renders the metrics.

## 4. Debugging Guidelines
*   **Rule of Thumb**: If the database records are correct but the UI shows double icons or wrong counts, the bug is strictly in the **Frontend Cache Logic** (`updatePostInCache` or React Query keys).
*   **Verification**: Always check the database directly using `tsx` scripts if data integrity is suspected.
