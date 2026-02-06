# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimal, distraction-free markdown editor for writers. Desktop application built with Electron and TypeScript. Focus is on clean writing experience, not code editing.

## Tech Stack

- **Framework**: Electron
- **Language**: TypeScript
- **Editor**: CodeMirror 6
- **Bundler**: Vite
- **Package Manager**: npm
- **Build/Packaging**: electron-builder

Planned for next iteration:
- **Markdown Parser**: markdown-it (for preview panel)
- **Syntax Highlighting**: highlight.js (code blocks in preview)

## Build Commands

```bash
# Install dependencies
npm install

# Development (builds then runs with hot reload for renderer)
npm run dev

# Build all components for production
npm run build

# Build individual components
npm run build:main      # Main process
npm run build:preload   # Preload script
npm run build:renderer  # Renderer (Vite)

# Type check without emitting
npm run typecheck

# Package for distribution
npm run package
```

## Project Structure

```
markdown-editor/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App entry, window creation, IPC handlers
│   │   ├── menu.ts     # Application menu
│   │   └── file-ops.ts # File system operations
│   ├── preload/        # Context bridge API
│   │   └── index.ts    # Exposes electronAPI to renderer
│   ├── renderer/       # Electron renderer process
│   │   ├── index.html
│   │   ├── index.ts    # Renderer entry, wires up editor and state
│   │   ├── editor.ts   # CodeMirror 6 setup
│   │   ├── preview.ts  # Markdown preview panel (planned)
│   │   ├── state.ts    # Document state management
│   │   ├── styles.css
│   │   └── global.d.ts # TypeScript declarations for window.electronAPI
│   └── shared/
│       └── types.ts    # Shared TypeScript types
├── dist/               # Compiled output (gitignored)
├── package.json
├── tsconfig.json       # Base TypeScript config
├── tsconfig.main.json  # Main process config
├── tsconfig.preload.json # Preload config
├── vite.config.ts
└── electron-builder.json
```

## Architecture Notes

### Electron Security Model
- Context isolation: Enabled
- Node integration: Disabled in renderer
- Preload script required for IPC between main and renderer
- Single instance enforcement

### IPC API (via preload → window.electronAPI)
- `openFile()` → returns `{ content, filePath }` or null
- `saveFile(filePath, content)` → returns boolean
- `saveFileAs(content)` → shows save dialog, returns filePath or null
- `showUnsavedDialog()` → returns `'save' | 'discard' | 'cancel'`
- `onMenuAction(callback)` → listens for menu commands
- `setWindowTitle(title)` → updates window title

### State Management
Document state is managed in `src/renderer/state.ts`:
- `filePath`: Current file path or null for new documents
- `isModified`: Whether content differs from last save
- `originalContent`: Content at last save (for modification detection)

### Development Workflow
The `npm run dev` command:
1. Builds main and preload processes once
2. Starts Vite dev server for renderer (port 5173)
3. Starts TypeScript watchers for main/preload
4. Launches Electron in development mode

## Current Development Goals

**Next iteration: Preview Panel**

1. Install markdown-it and highlight.js dependencies
2. Create preview panel component with markdown rendering
3. Update layout for split view (editor left, preview right)
4. Add View menu with Toggle Preview (Ctrl+E)
5. Implement preview visibility toggle with layout adjustment
6. Add scroll sync (preview follows editor cursor)
7. Style preview panel for rendered HTML

**Implementation notes:**
- Preview renders markdown as formatted HTML in real-time
- Default state: split view (editor left, preview right)
- Editor expands to full width when preview is hidden
- Code blocks in preview should have syntax highlighting via highlight.js

## Key Specifications

See `markdown-editor-v1.md` for the full specification and `mvp-implementation-plan.md` for the implementation roadmap.

## Custom Commands

- `/plan [description]` - Create a development plan in `nimbalyst-local/plans/`
- `/track [type] [description]` - Track bugs, tasks, ideas, or decisions
