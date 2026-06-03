# Custom Emojis & Exclusive Reactions Implementation

This document outlines the architecture for Misskey-style emoji reactions and R2-hosted custom emojis.

## Core Concepts

### 1. Single Reaction Exclusivity
Users can only have **one** reaction per post or chat message. 
- "Like" is treated as a standard emoji reaction (`❤️`).
- Adding a new reaction automatically removes/replaces the previous one.
- Toggling the same reaction removes it (Undo).

### 2. Custom Emoji Storage
- Custom emojis are stored in the `CustomEmoji` table.
- Each emoji consists of a `shortcode` (e.g., `:blob_cat:`) and a `url` (pointing to R2 storage).
- Emojis are grouped by `category` for the UI picker.

### 3. Global Metadata Caching
To prevent N+1 database queries when rendering lists (feeds/chat), we use the `EmojiProvider`:
- Fetches all custom emoji metadata once on app load.
- Provides a centralized cache via `useEmojis()` hook.
- Used by `parseFediverseContent` to replace shortcodes with `<img>` tags.

## Technical Architecture

### Database Schema
- **`CustomEmoji`**: Stores `id`, `shortcode`, `url`, `category`, `remoteId`.
- **`Reactions`**: Updated to support arbitrary emoji strings (unicode or shortcodes).
- **`Notifications`**: Added `emoji` column to store the specific reaction for rich feedback.

### Fediverse Integration (ActivityPub)
We follow the standard `EmojiReact` activity type used by Misskey and Pleroma.
- **Outgoing**: Sends `EmojiReact` with a `tag` array containing the custom emoji shortcode and URL.
- **Incoming**: Parses `EmojiReact` activities. If the emoji is remote, it is temporarily cached or mapped to standard unicode if possible.
- **Fallback**: Mastodon sees these as "Like" activities but may strip the specific emoji metadata.

### Rendering Logic
All user-generated content MUST pass through `parseFediverseContent`:
```typescript
const renderedContent = parseFediverseContent(rawText, emojiMeta);
```
In `ReactMarkdown`, we use `rehype-raw` to safely render the resulting `<img>` tags.

## UI Standards
- **Emoji Picker**: Supports custom categories with search filtering.
- **Tooltips**: Reaction tooltips show a **3xl** preview of the custom emoji for better visibility.
- **Chat**: Green text and links are processed alongside emojis to ensure layout integrity.

## Commands
- `npm run register-emojis`: Script to sync local/R2 assets with the database.
