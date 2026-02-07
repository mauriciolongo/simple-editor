# Markdown Editor v1 — Specification

## Overview

A plain, fully-functional markdown editor. Desktop application built with Electron and TypeScript. Focused entirely on editing markdown documents — nothing more, nothing less.

---

## Tech Stack

| Component | Technology |
| --- | --- |
| Framework | Electron |
| Language | TypeScript |
| Editor | CodeMirror 6 |
| Markdown Parser | markdown-it |
| Syntax Highlighting | highlight.js (preview only) |
| Bundler | Vite |
| Package Manager | npm |
| Build/Packaging | electron-builder |

---

## Core Features

### 1. Editor Panel

- **Word wrap**: Soft wrap at window edge (no horizontal scrolling)
- **Line breaks**: Hard breaks only on Enter (paragraph boundaries)
- **Font**: Monospace, reasonable default size
- **Standard editing**: Undo, redo, cut, copy, paste, select all
- **No syntax highlighting**: Plain text appearance

### 2. Preview Panel

- **Live preview**: Renders markdown as formatted HTML in real-time
- **Scroll behavior**: Preview follows cursor position in editor
- **Toggle visibility**: User can show/hide preview panel
- **Layout behavior**: Editor expands to full width when preview is hidden
- **Default state**: Split view (editor left, preview right)

### 3. Markdown Flavor

Start with at least **CommonMark** — the same standard used by Claude.ai, but our final goal will be to achieve feature parity with the GitHub dialect (GFM).

Supported elements:
- Headings (`#` through `######`)
- Bold (`**text**` or `__text__`)
- Italic (`*text*` or `_text_`)
- Bold + Italic (`***text***`)
- Strikethrough (`~~text~~`)
- Links (`[text](url)`)
- Images (`![alt](url)`) — see Image Handling below
- Blockquotes (`> text`)
- Ordered lists (`1. item`)
- Unordered lists (`- item` or `* item`)
- Nested lists (indented sub-items)
- Task lists (`- [ ] todo` / `- [x] done`)
- Inline code (`` `code` ``)
- Code blocks (fenced with ``` or indented) — syntax highlighting in preview
- Horizontal rules (`---` or `***`)
- Tables
- Autolinks (bare URLs become clickable)
- Escape characters (`\*not italic\*`)

**Not supported:**
- Raw HTML passthrough (use code blocks for HTML content)

### 4. Image Handling

- **Local images**: When inserting a local image, copy the file to `./images/` subfolder (relative to the markdown file) and use a relative path
- **Web images**: Load directly from URL — no local copy
- **Preview**: Display both local and remote images in the preview panel

### 5. File Operations

| Action | Shortcut | Description |
| --- | --- | --- |
| New | Ctrl+N | Create new empty document |
| Open | Ctrl+O | Open .md file via native OS dialog |
| Save | Ctrl+S | Save current file (prompts for name if new) |
| Save As | Ctrl+Shift+S | Save with new filename |

- **Window title**: Shows current filename; displays `*` prefix when unsaved changes exist
- **Unsaved changes**: Prompt user to save before closing or opening another file
- **File filter**: Default to `.md` files in open/save dialogs

### 6. Recent Files

- Track the **last 10 opened/saved files**
- Accessible via **File → Recent Files** submenu
- Each entry shows filename and path
- Clicking an entry opens that file
- Persisted between application sessions (store in user data directory)
- Automatically remove entries for files that no longer exist

### 7. Word Count

- Display **accurate word count** in the status bar
- Update in real-time as user types
- Count algorithm:
  - Strip markdown syntax before counting (e.g., `**bold**` → `bold`)
  - Split on whitespace
  - Only count sequences containing at least one alphanumeric character
  - Exclude content inside code blocks and inline code from word count

### 8. Keyboard Shortcuts

**File operations:**
| Shortcut | Action |
| --- | --- |
| Ctrl+N | New file |
| Ctrl+O | Open file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+W | Close window |

**Editing:**
| Shortcut | Action |
| --- | --- |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+A | Select all |

**Formatting (wraps selection):**
| Shortcut | Action | Syntax |
| --- | --- | --- |
| Ctrl+B | Bold | `**selection**` |
| Ctrl+I | Italic | `*selection*` |

**View:**
| Shortcut | Action |
| --- | --- |
| Ctrl+E | Toggle preview panel |

---

## User Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  File   Edit   View                                    [─][□][×]│
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│         EDITOR                 │         PREVIEW                │
│      (monospace text)          │      (rendered HTML)           │
│                                │                                │
│                                │                                │
│                                │                                │
│                                │                                │
├────────────────────────────────┴────────────────────────────────┤
│  Words: 1,234                                    document.md *  │
└─────────────────────────────────────────────────────────────────┘
```

### Menu Structure

**File**
- New (Ctrl+N)
- Open (Ctrl+O)
- Save (Ctrl+S)
- Save As (Ctrl+Shift+S)
- ---
- Recent Files →
  - file1.md
  - file2.md
  - ...
  - Clear Recent Files
- ---
- Exit

**Edit**
- Undo (Ctrl+Z)
- Redo (Ctrl+Y)
- ---
- Cut (Ctrl+X)
- Copy (Ctrl+C)
- Paste (Ctrl+V)
- ---
- Select All (Ctrl+A)

**View**
- Toggle Preview (Ctrl+E)

---

## Technical Requirements

### Project Structure
```
markdown-editor/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts
│   │   ├── menu.ts
│   │   └── file-ops.ts
│   ├── renderer/       # Electron renderer process
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── editor.ts
│   │   ├── preview.ts
│   │   └── styles.css
│   └── shared/         # Shared types/utils
│       └── types.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

### Data Persistence

Store user data in the OS-appropriate location:
- **Windows**: `%APPDATA%/markdown-editor/`
- **macOS**: `~/Library/Application Support/markdown-editor/`
- **Linux**: `~/.config/markdown-editor/`

Files to persist:
- `recent-files.json` — Array of recent file paths

### Electron Configuration

- **Context isolation**: Enabled
- **Node integration**: Disabled in renderer
- **Preload script**: Required for IPC between main and renderer
- **Single instance**: Enforce single app instance

### Build & Distribution

- **Primary development platform**: Linux
- **Target platforms**: Linux, Windows, macOS
- **Build strategy**:
  - Develop and test on Linux
  - Build cross-platform packages for release candidates only
  - Windows/macOS builds generated from Linux (unsigned)
- **Linux formats**: AppImage, deb
- **Windows formats**: NSIS installer (.exe)
- **macOS formats**: DMG (unsigned — users must bypass Gatekeeper)
- **Code signing**: Deferred (not required for initial release)

---

## Out of Scope

- Tabs / multi-file editing
- Custom themes / dark mode
- Syntax highlighting in editor (plain text appearance intentional)
- Export to PDF/HTML
- Find and replace
- Spell checking
- Auto-save
- Custom fonts
- Plugin system
- Cloud sync
- Project management features

---

## Success Criteria

1. User can create, open, edit, and save markdown files
2. Preview accurately renders CommonMark markdown
3. Word count updates correctly in real-time
4. Recent files persist and work across sessions
5. All keyboard shortcuts function as specified
6. App runs on Linux (with cross-platform builds for Windows and macOS)
