# Post Interaction Flow & Data Integrity

This document defines the strict architectural standards for post interactions (Like, Repost, Quote, Bookmark) to ensure consistency across the codebase.

## 1. Interaction Definitions

### Pure Repost (Announce)
*   **Definition**: A post that purely shares another post without adding new content.
*   **Data Criteria**: `repostOfId` is present AND `content` is empty (`""`).
*   **ActivityPub Mapping**: Corresponds to an `Announce` activity.
*   **Behavior**:
    *   Toggleable: Clicking "Repost" again removes it (Undo Repost).
    *   Unique: A user can only have **one** active Pure Repost for a specific post.
    *   Impact: Increases `repostCount`.
    *   UI: Makes the Repost button **active** (Emerald color).

### Quote Post (FEP-e232 / Misskey)
*   **Definition**: A post that shares another post but adds its own commentary or media.
*   **Data Criteria**: `quoteOfId` is present. (Legacy quotes may still use `repostOfId` with content, but `quoteOfId` is the new standard).
*   **ActivityPub Mapping**: Corresponds to a `Create` activity with `tag` links (FEP-e232) or `quoteUrl` (Misskey).
*   **Behavior**:
    *   Additive: Can be performed multiple times by the same user.
    *   Independent: Does NOT trigger "Undo Repost".
    *   Impact: Handled as a separate post with a `quoteOf` relationship.
    *   UI: Renders the quoted post as a native preview card.

## 2. Thread Backfilling & Data Integrity

### context URI Tracking
*   Every federated post MUST save the `context` (or `conversation`) URI from ActivityPub.
*   This allows fetching the entire conversation branch in a single query, ensuring thread indicators ("Membalas @user") are always accurate.

### Recursive Healing
*   When receiving a post with `inReplyTo` or `quoteOf` that is missing from the local DB, the system MUST perform a **Signed GET** fetch to reconstruct the chain.
*   Recursion is strictly capped at **10 levels** for security.

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
