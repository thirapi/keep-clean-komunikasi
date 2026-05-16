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

### Storage → Display (Chat View)

```
DB: "**hello** <@userId>"
         ↓
resolveMentionsForView()  →  "**hello** [@john](#mention:uid)"
         ↓
ReactMarkdown + remarkGfm  →  <strong>hello</strong> <span>@john</span>
```

Rendering happens in `message-item.tsx` via `ReactMarkdown`. No changes are needed to the rendering pipeline because it already parses standard markdown.

### Input → Visual Decoration

The `MarkdownDecoratorPlugin` applies **visual-only** decoration without modifying text content:

| What User Types | What They See | What Gets Stored |
|---|---|---|
| `**bold**` | **\*\*** **bold** **\*\*** (symbols dim) | `**bold**` |
| `_italic_` | *\_* *italic* *\_* (symbols dim) | `_italic_` |
| `~~strike~~` | ~~\~\~~~ ~~strike~~ ~~\~\~~~ (symbols dim) | `~~strike~~` |
| `` `code` `` | *\`* `code` *\`* (symbols dim) | `` `code` `` |

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

## MarkdownDecoratorPlugin

### Inline Decoration (TextNode transform)
- Detects patterns within a single TextNode (e.g., `**bold**`)
- Splits into segments: symbol nodes (dim opacity + format) and content nodes (format only)
- Symbol nodes use `mode: "token"` to prevent typing into them

### Cross-Paragraph Decoration (Update listener)
- Detects patterns spanning multiple paragraphs (e.g., `**line1\nline2**`)
- Scans all paragraphs, finds opening symbol at start + closing at end
- Applies format to all text nodes between them

### Code Block Decoration (Update listener)
- Detects ``` fences across paragraphs
- Fence lines: very dim (opacity 0.25) + monospace
- Content lines: monospace styling matching chat view

### Guard Conditions
- `isProcessingRef` prevents re-entry loops between inline transform and update listener
- `setTimeout(0)` defers cross-paragraph processing until after inline transforms complete
- Processed nodes are detected by checking `getFormat()` and `getStyle()`

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
