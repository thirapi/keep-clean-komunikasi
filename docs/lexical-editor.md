# Lexical Editor Architecture

## Overview

The chat input uses **Meta's Lexical** framework instead of a native `<textarea>`. This solves cursor/selection drift that occurs when styling text in a plain textarea with an overlay div.

### Why Lexical?
A `<textarea>` only renders plain text. To show markdown formatting (bold, italic, etc.), the previous approach used a separate overlay `<div>` positioned on top. This caused:
- Cursor misalignment between textarea and overlay
- Selection highlight drift
- Font metric inconsistencies across browsers

Lexical uses a `contentEditable` div as both the input and the display, so the cursor, selection, and visual styling are always in sync.

## Architecture

```
┌─────────────────────────────────────┐
│  MentionTextarea (mention-textarea) │  ← Main editor component
│  ┌───────────────────────────────┐  │
│  │  LexicalComposer              │  │  ← Manages editor instance
│  │  ├── RichTextPlugin           │  │  ← ContentEditable + placeholder
│  │  ├── MarkdownDecoratorPlugin  │  │  ← Visual markdown decoration
│  │  ├── FloatingToolbarPlugin    │  │  ← Selection toolbar (Bold, etc.)
│  │  ├── MentionPlugin            │  │  ← @mention autocomplete
│  │  ├── SubmitOnEnterPlugin      │  │  ← Enter → send, Shift+Enter → newline
│  │  ├── SyncValuePlugin          │  │  ← Clears editor after send
│  │  ├── AutoHeightPlugin         │  │  ← Dynamic input height
│  │  └── EditorRefPlugin          │  │  ← Exposes LexicalEditor instance
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|---|---|
| `src/components/ui/mention-textarea.tsx` | Main editor component. Composes all plugins. |
| `src/components/lexical/mention-node.tsx` | `DecoratorNode` — atomic `@username` badge. |
| `src/components/lexical/mention-plugin.tsx` | Detects `@` trigger, shows autocomplete dropdown. |
| `src/components/lexical/markdown-decorator-plugin.tsx` | Preserves markdown symbols with dimmed opacity styling. |
| `src/components/lexical/floating-toolbar-plugin.tsx` | Selection-based toolbar for Bold, Italic, etc. |

## Data Flow

### Input → Storage

```
User types: **hello** @john
         ↓
Lexical TextNode("**hello**") + MentionNode("john")
         ↓
editorStateToPlainText()  →  "**hello** <@userId>"
         ↓
Saved to database as raw string
```

**Rule**: Markdown symbols (`**`, `_`, `~~`, `` ` ``, ` ``` `) are **NEVER removed** from the text. They are stored as-is in the database.

### Input → Visual Decoration (Lexer-based)

The `MarkdownDecoratorPlugin` applies **visual-only** decoration using a global lexer-based architecture. This ensures high-fidelity preview that matches Discord's behavior, including support for multiline blocks and nested styles (e.g., ***bold-italic***).

| What User Types | What They See | What Gets Stored |
|---|---|---|
| `**bold**` | **\*\*** **bold** **\*\*** (symbols dim) | `**bold**` |
| `_italic_` | *\_* *italic* *\_* (symbols dim) | `_italic_` |
| `***bold italic***` | ***\*\*\**** ***bold italic*** ***\*\*\**** (additive styles) | `***bold italic***` |
| `~~strike~~` | ~~\~\~~~ ~~strike~~ ~~\~\~~~ (symbols dim) | `~~strike~~` |
| `` `code` `` | *\`* `code` *\`* (symbols dim) | `` `code` `` |
| ` ```code block``` ` | Fenced lines dim, content monospace | ` ```code block``` ` |

---

### Storage → Display (Chat View Renderer)

Rendering happens in `message-item.tsx` via a pre-processing pipeline in `resolveMentionsForView`:
1. **Mention Protection**: Extracts `<@uid>` tokens into placeholders (`__MENTION_BLOCK__`) to prevent stylistic regex (like `_`) from mangling mention links.
2. **Code Protection**: Extracts ` ``` ` blocks to protect them during formatting.
3. **Newline Injection**: Replaces `\n` with a placeholder (`\uE001`) to bypass CommonMark line merging.
4. **Flanking Restoration**: Inyects ZWSP (`\u200B`) inside multiline style blocks to force CommonMark to recognize delimiters.
5. **Tail Trimming**: Trims trailing newlines sitting right before closing markdown symbols (Discord spec).
6. **Code Normalization**: Ensures closing ` ``` ` are on new lines so `remark` renders them as blocks.
7. **Restoration**: Restores mentions and replaces the placeholder (`\uE001`) with `<br />` during the final render.

## Mentions

### MentionNode (DecoratorNode)
- Renders as an **atomic, non-editable** inline badge: `@username`
- Cannot be partially edited — backspace deletes the entire mention
- Stored as `<@userId>` token in the database
- `isIsolated()` returns `false` to allow proper backspace deletion
- All visual styling is in `decorate()` only (not `createDOM()`) to prevent style stacking

### MentionPlugin
- Triggers on `@` character
- Shows a searchable dropdown of room participants + `@everyone`
- Keyboard navigable (↑↓ to select, Enter/Tab to insert, Esc to cancel)
- Inserts `MentionNode` followed by a space `TextNode`

## FloatingToolbarPlugin

- Appears centered above the **editor container** (not the selection) to prevent position drift when content scrolls
- Buttons insert markdown symbols around selection (not Lexical format commands)
- Available actions: **Bold** (`**`), **Italic** (`_`), **Strikethrough** (`~~`), **Inline Code** (`` ` ``), **Code Block** (`` ``` ``)
- Inline Code on multi-line: wraps each line individually
- Code Block: wraps with ``` fences on separate lines

## MarkdownDecoratorPlugin (The Lexer)

The editor uses a **Global Lexer and Virtual Mapping** strategy for markdown decoration. Instead of isolated node transforms, it treats the entire document as a single string to resolve complex multiline and nested patterns.

### 1. Global State Extraction (`traverseBuild`)
- Traverses the entire Lexical AST to build a `globalText` string (representing all paragraphs joined by `\n`).
- Maintains a mapping of `globalText` byte offsets back to their original `TextNode` instances.

### 2. Syntax Highlighting Pass
- Runs a sequential lexer pass using optimized RegEx patterns (ordered by symbol length: `***` → `**` → `*`).
- **Additive Formatting**: Uses bitmasks (`FORMAT_BOLD`, `FORMAT_ITALIC`, etc.) to allow styles to overlap.
- **Overlap Protection**: Prevents a shorter symbol (like `*`) from claiming characters already owned by a longer symbol (like `**`).
- **Code Block Isolation**: Automatically skips all markdown patterns found inside ` ``` ` blocks.

### 3. Bit-Mapped Node Decoration
- Maps the calculated `format` and `style` bits back to the `TextNode` instances.
- **Surgical Splitting**: Only splits a `TextNode` when a style boundary changes (e.g., at the exact moment a `**` starts).
- **Symbol Dimming**: Symbols are wrapped in `setStyle("opacity: 0.35")` and set to `mode: "token"` to prevent direct editing, though they remain part of the text.

### 4. Stability Guards
- `isProcessingRef` prevents infinite update loops during decoration.
- `discrete: true` ensures that formatting changes are committed atomically.
- `setTimeout(0)` schedules the lexer pass to run after Lexical's internal reconciler, ensuring a smooth typing experience.

## Integration Points

### MessageInput
- Uses `MentionTextarea` with `onSubmit` for Enter-to-send
- `inputRef` (HTMLDivElement) is passed down for global auto-focus via `useAutoFocusInput`

### MessageItem (Edit Mode)
- Uses the same `MentionTextarea` component
- Enter → save edit, Escape → cancel
- Raw content loaded via `createInitialEditorState()` which parses `<@userId>` tokens

### ChatRoom
- Creates `inputRef` as `HTMLDivElement` (not HTMLTextAreaElement)
- `useAutoFocusInput` supports `HTMLDivElement` for contentEditable focus

## Dependencies

```
lexical
@lexical/react
@lexical/rich-text
@lexical/list
@lexical/link
@lexical/code
@lexical/markdown
@lexical/selection
@lexical/utils
```

> **Note**: While `@lexical/rich-text`, `@lexical/list`, etc. are installed, the editor currently only registers `MentionNode` in the config. The markdown decoration is handled at the visual level without converting to rich text nodes.
